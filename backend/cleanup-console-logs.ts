/**
 * Console.log Cleanup Script
 * 
 * This script removes unnecessary console.log statements from the codebase
 * while preserving:
 * - Server startup logs (server.ts)
 * - Seeder logs (seeder.ts, seeder-cli.ts)
 * - Migration scripts logs
 * - Critical error logs (console.error)
 * 
 * Run: npx ts-node cleanup-console-logs.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface CleanupResult {
  file: string;
  removedCount: number;
  preservedCount: number;
}

class ConsoleLogCleaner {
  private results: CleanupResult[] = [];
  private preservePatterns = [
    /server\.ts$/,
    /seeder\.ts$/,
    /seeder-cli\.ts$/,
    /seed-events\.ts$/,
    /run-event-seeder\.ts$/,
    /migrate-attendance\.ts$/,
    /test-.*\.ts$/,
    /.*-test\.ts$/,
  ];

  private shouldPreserveFile(filePath: string): boolean {
    return this.preservePatterns.some((pattern) => pattern.test(filePath));
  }

  private cleanFileContent(content: string, filePath: string): { cleaned: string; removed: number; preserved: number } {
    const lines = content.split("\n");
    const cleanedLines: string[] = [];
    let removed = 0;
    let preserved = 0;
    let insideMultiLineComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Track multi-line comments
      if (trimmed.startsWith("/*") && !trimmed.includes("*/")) {
        insideMultiLineComment = true;
      }
      if (insideMultiLineComment && trimmed.includes("*/")) {
        insideMultiLineComment = false;
      }

      // Skip if inside multi-line comment
      if (insideMultiLineComment) {
        cleanedLines.push(line);
        continue;
      }

      // Check if line contains console.log
      if (
        /console\.log\(/.test(line) &&
        !trimmed.startsWith("//") && // Not commented out
        !trimmed.startsWith("*") // Not in JSDoc
      ) {
        // Check if it's a critical log we should preserve
        const shouldPreserve =
          /🚀|📝|🌍|✅|❌|⚠️|🔌|📊|🌱|👋/.test(line) || // Emoji logs (likely important)
          /Starting server|Database|Seeding|Migration|Error|Warning/.test(line);

        if (shouldPreserve && this.shouldPreserveFile(filePath)) {
          cleanedLines.push(line);
          preserved++;
        } else {
          // Check if console.log spans multiple lines
          let completeStatement = line;
          let j = i;
          while (j < lines.length && !completeStatement.includes(");")) {
            j++;
            if (j < lines.length) {
              completeStatement += "\n" + lines[j];
            }
          }

          // If multi-line, skip all those lines
          if (j > i) {
            i = j;
          }
          removed++;
        }
      } else {
        cleanedLines.push(line);
      }
    }

    return {
      cleaned: cleanedLines.join("\n"),
      removed,
      preserved,
    };
  }

  private processDirectory(dirPath: string): void {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, dist, build directories
        if (!["node_modules", "dist", "build", ".git"].includes(entry)) {
          this.processDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // Process TypeScript and JavaScript files
        if (/\.(ts|tsx|js|jsx)$/.test(entry) && !entry.endsWith(".d.ts")) {
          this.processFile(fullPath);
        }
      }
    }
  }

  private processFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, "utf8");
      
      // Skip if file doesn't contain console.log
      if (!/console\.log/.test(content)) {
        return;
      }

      const result = this.cleanFileContent(content, filePath);

      if (result.removed > 0) {
        writeFileSync(filePath, result.cleaned, "utf8");
        this.results.push({
          file: filePath,
          removedCount: result.removed,
          preservedCount: result.preserved,
        });
        console.log(`✅ Cleaned: ${filePath} (removed ${result.removed}, preserved ${result.preserved})`);
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  public cleanProject(projectPath: string): void {
    console.log("🧹 Starting console.log cleanup...\n");
    console.log(`📁 Project path: ${projectPath}\n`);

    // Clean backend
    const backendPath = join(projectPath, "backend", "src");
    if (statSync(backendPath).isDirectory()) {
      console.log("🔍 Cleaning backend...");
      this.processDirectory(backendPath);
    }

    // Clean frontend
    const frontendPath = join(projectPath, "frontend", "src");
    if (statSync(frontendPath).isDirectory()) {
      console.log("\n🔍 Cleaning frontend...");
      this.processDirectory(frontendPath);
    }

    this.generateReport();
  }

  private generateReport(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 CLEANUP REPORT");
    console.log("=".repeat(60));

    const totalRemoved = this.results.reduce((sum, r) => sum + r.removedCount, 0);
    const totalPreserved = this.results.reduce((sum, r) => sum + r.preservedCount, 0);
    const filesModified = this.results.length;

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Files Modified: ${filesModified}`);
    console.log(`   Console.logs Removed: ${totalRemoved}`);
    console.log(`   Console.logs Preserved: ${totalPreserved}`);

    if (filesModified > 0) {
      console.log(`\n📋 MODIFIED FILES:`);
      this.results.forEach((r, i) => {
        const relativePath = r.file.replace(process.cwd(), ".");
        console.log(`   ${i + 1}. ${relativePath}`);
        console.log(`      Removed: ${r.removedCount}, Preserved: ${r.preservedCount}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Cleanup completed successfully!");
    console.log("=".repeat(60));
  }
}

// Run cleanup
const projectPath = process.cwd();
const cleaner = new ConsoleLogCleaner();
cleaner.cleanProject(projectPath);
