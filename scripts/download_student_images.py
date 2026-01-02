#!/usr/bin/env python3
"""
Download student images for a selected school by calling the backend export endpoint.

Usage:
  python scripts/download_student_images.py --base-url http://localhost:5000

The script will:
 - List schools via GET /api/admin/export/schools
 - Prompt you to choose a school
 - Prompt admin username and password (password input is hidden)
 - POST to /api/admin/export/schools/<schoolId>/students with { username, password }
 - Create folders using the same naming as FileUtils.createStudentPhotoFolder
 - Download each photo (HTTP URL) concurrently with a limited worker pool

Notes:
 - The backend must be running and reachable at the provided base URL.
 - The script saves files under ./downloads/<SchoolName>/Students/<studentFolder>/
"""

import argparse
import getpass
import os
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List, Dict, Any

import requests


SESSION = requests.Session()


def sanitize_school_name(name: str) -> str:
    # Remove non-alphanum and collapse spaces to underscore
    if not name:
        return 'unknown'
    clean = re.sub(r"[^a-zA-Z0-9\s]", "", name)
    clean = re.sub(r"\s+", "_", clean).strip()
    return clean or 'unknown'


def student_folder_name(first_name: str, age: int, grade: int, section: str, blood_group: str, student_id: str) -> str:
    first = (first_name or 'unknown').split()[0]
    return f"student@{first}@{age}@{grade}@{section}@{blood_group}@{student_id}"


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def download_url(url: str, target: Path, timeout: int = 30) -> bool:
    try:
        resp = SESSION.get(url, timeout=timeout)
        resp.raise_for_status()
        with open(target, 'wb') as f:
            f.write(resp.content)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://localhost:5000',
                        help='Base URL of the backend API (e.g. http://localhost:5000)')
    parser.add_argument('--out', default='./downloads',
                        help='Output directory root')
    parser.add_argument('--workers', type=int, default=8,
                        help='Concurrent download workers')
    parser.add_argument('--username', help='Admin username (optional)')
    parser.add_argument(
        '--password', help='Admin password (optional, caution: visible in process list)')

    args = parser.parse_args()

    base = args.base_url.rstrip('/')
    out_root = Path(args.out)
    out_root.mkdir(parents=True, exist_ok=True)

    # 1. list schools
    schools_url = f"{base}/api/admin/export/schools"
    try:
        r = SESSION.get(schools_url, timeout=30)
        r.raise_for_status()
        data = r.json()
        if not data.get('success'):
            print('Failed to list schools:', data)
            sys.exit(1)
        schools = data.get('data') or []
    except Exception as e:
        print('Error fetching schools:', e)
        sys.exit(1)

    if not schools:
        print('No active schools available')
        sys.exit(0)

    print('Select a school:')
    for i, s in enumerate(schools, start=1):
        print(f"{i}) {s.get('name')} ({s.get('schoolId') or s.get('_id')})")

    choice = input('Enter number: ').strip()
    try:
        idx = int(choice) - 1
        assert 0 <= idx < len(schools)
    except Exception:
        print('Invalid choice')
        sys.exit(1)

    school = schools[idx]
    # Prefer the MongoDB ObjectId (_id) when available to avoid CastError on server
    school_id = str(school.get('_id') or school.get('schoolId'))
    school_name = sanitize_school_name(school.get('name'))

    # Allow CLI-supplied credentials for non-interactive use
    if args.username:
        username = args.username.strip()
    else:
        username = input('Admin username: ').strip()

    # Try secure password prompt first; fall back to visible input when unavailable
    if args.password:
        password = args.password
    else:
        password = None
        try:
            if sys.stdin is None or not sys.stdin.isatty():
                # Non-interactive stdin (e.g., redirected) - fallback
                password = input('Admin password (will be visible): ')
            else:
                # Normal interactive terminal - hide input
                password = getpass.getpass('Admin password: ')
        except (Exception, KeyboardInterrupt):
            # getpass can fail in some terminals; fallback to visible input
            try:
                password = input('\nAdmin password (fallback, visible): ')
            except Exception:
                print(
                    '\nFailed to read password interactively. Provide --password or run in an interactive terminal.')
                sys.exit(1)

    payload = {'username': username, 'password': password}
    export_url = f"{base}/api/admin/export/schools/{school_id}/students"

    try:
        r = SESSION.post(export_url, json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        if not data.get('success'):
            print('Failed to export students:', data)
            sys.exit(1)
        students = data.get('data') or []
    except Exception as e:
        print('Error exporting students:', e)
        sys.exit(1)

    print(f"Fetched {len(students)} students. Preparing to download images...")

    # Build download tasks
    tasks = []  # (url, target_path)
    base_school_folder = out_root / school_name / 'Students'
    ensure_dir(base_school_folder)

    for s in students:
        first = s.get('firstName') or 'unknown'
        dob = s.get('dob')
        age = 0
        if dob:
            try:
                from datetime import datetime
                age = datetime.now().year - datetime.fromisoformat(dob).year
            except Exception:
                age = 0
        grade = s.get('grade') or 0
        section = s.get('section') or 'A'
        blood = s.get('bloodGroup') or 'NA'
        student_id = s.get('studentId') or str(s.get('id'))

        folder_name = student_folder_name(
            first, age, grade, section, blood, student_id)
        student_folder = base_school_folder / folder_name
        ensure_dir(student_folder)

        photos = s.get('photos') or []
        for p in photos:
            url = p.get('photoPath') or p.get('secure_url') or p.get('url')
            if not url or not url.startswith('http'):  # skip non-http
                continue
            # prefer photoNumber for filename
            num = p.get('photoNumber')
            ext = os.path.splitext(url.split('?')[0])[1] or '.jpg'
            if len(ext) > 5:
                ext = '.jpg'
            filename = f"{num if num is not None else int(threading.get_ident())}{ext}"
            target = student_folder / filename
            tasks.append((url, target))

    if not tasks:
        print('No downloadable images found for selected school.')
        sys.exit(0)

    # Download concurrently
    success_count = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(download_url, url, target): (
            url, target) for url, target in tasks}
        for fut in as_completed(futures):
            url, target = futures[fut]
            ok = fut.result()
            if ok:
                print(f"Saved: {target}")
                success_count += 1

    print(
        f"Completed. {success_count}/{len(tasks)} images downloaded to {out_root}")


if __name__ == '__main__':
    main()
