/**
 * Auto-Attend Integration Test Script
 *
 * This script demonstrates how to:
 * 1. Get school API information
 * 2. Send test events to the Auto-Attend endpoint
 * 3. Query captured events
 * 4. Get reconciliation reports
 *
 * Usage: ts-node test-autoattend.ts
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// You'll need to update these with real values from your system
const schoolSlug = "lasttesthabib"; // or schoolId like 'SCH0017'
const API_KEY =
  "064a19d440f21319cd2f77036af26c54495417eadf16a62dd0537ca3a2877543";
const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGViMDBmOTdjMzE2MTA3MmIwYThlOCIsInVzZXJuYW1lIjoibGFzdF90ZXN0X2hhYmliIiwicm9sZSI6ImFkbWluIiwic2Nob29sSWQiOiJ7XG4gIG5hbWU6ICdMYXN0X3Rlc3RfaGFiaWInLFxuICBzdGF0dXM6ICdhY3RpdmUnLFxuICBpZDogbmV3IE9iamVjdElkKCc2OGRlYjAwZjk3YzMxNjEwNzJiMGE4ZTYnKVxufSIsImlhdCI6MTc2MDA5MjY2MSwiZXhwIjoxNzYwMTIxNDYxfQ.KmFyTx4jXJvBcqWvn9sxsL7F8XWjc4KzOMl6ly5KPt0"; // Get from login response

interface AutoAttendEvent {
  event: {
    eventId: string;
    descriptor: string;
    studentId: string;
    firstName: string;
    age: string;
    grade: string;
    section: string;
    bloodGroup: string;
    capturedAt: string;
    capturedDate: string;
    capturedTime: string;
  };
  source: {
    app: string;
    version: string;
    deviceId?: string;
  };
  test?: boolean;
}

// Helper to create test event payload
function createTestEvent(
  studentId: string,
  grade: number,
  section: string,
  firstName: string = "TestStudent"
): AutoAttendEvent {
  const now = new Date();
  const capturedAt = now.toISOString();
  const capturedDate = capturedAt.split("T")[0];
  const capturedTime = now.toTimeString().split(" ")[0];
  const age = Math.floor(Math.random() * 5) + 13; // 13-17
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const bloodGroup =
    bloodGroups[Math.floor(Math.random() * bloodGroups.length)];

  return {
    event: {
      eventId: `${capturedAt}_student@${firstName.toLowerCase()}@${age}@${grade}@${section}@${bloodGroup}@${studentId}`,
      descriptor: `student@${firstName.toLowerCase()}@${age}@${grade}@${section}@${bloodGroup}@${studentId}`,
      studentId,
      firstName,
      age: age.toString(),
      grade: grade.toString(),
      section,
      bloodGroup,
      capturedAt,
      capturedDate,
      capturedTime,
    },
    source: {
      app: "AutoAttend",
      version: "1.0.0",
      deviceId: "TEST-DEVICE-001",
    },
    test: true, // Set to false for real events
  };
}

async function testAutoAttendIntegration() {
  console.log("🚀 Starting Auto-Attend Integration Tests\n");

  // Test 1: Send a test event (public endpoint, no JWT)
  // console.log("📤 Test 1: Sending test event to Auto-Attend endpoint...");
  // try {
  //   const testEvent = createTestEvent(
  //     "SCH0017-STU-202506-0001",
  //     6,
  //     "C",
  //     "Velit"
  //   );
  //   const response = await axios.post(
  //     `${BASE_URL}/attendance/${schoolSlug}/events`,
  //     testEvent,
  //     {
  //       headers: {
  //         "X-Attendance-Key": API_KEY,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log("✅ Test event sent successfully:");
  //   console.log(JSON.stringify(response.data, null, 2));
  // } catch (error: any) {
  //   console.error("❌ Failed to send test event:");
  //   console.error(error.response?.data || error.message);
  // }
  // console.log("\n---\n");

  // Test 2: Send a real event (will be persisted)
  console.log("📤 Test 2: Sending real event (will be persisted)...");
  // try {
  //   const realEvent = createTestEvent(
  //     "SCH0017-STU-202509-0001",
  //     9,
  //     "B",
  //     "Voluptatem"
  //   );
  //   realEvent.test = false; // Real event
  //   const response = await axios.post(
  //     `${BASE_URL}/attendance/${schoolSlug}/events`,
  //     realEvent,
  //     {
  //       headers: {
  //         "X-Attendance-Key": API_KEY,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log("✅ Real event persisted successfully:");
  //   console.log(JSON.stringify(response.data, null, 2));
  // } catch (error: any) {
  //   console.error("❌ Failed to send real event:");
  //   console.error(error.response?.data || error.message);
  // }
  // console.log("\n---\n");

  // // Test 3: Send duplicate event (should return 409)
  // console.log("📤 Test 3: Sending duplicate event (should return 409)...");
  // try {
  //   const duplicateEvent = createTestEvent("STU002", 10, "A", "Sarah");
  //   duplicateEvent.test = false;
  //   duplicateEvent.event.eventId = "DUPLICATE_EVENT_ID_123"; // Use same ID twice

  //   // Send first
  //   await axios.post(
  //     `${BASE_URL}/attendance/${schoolSlug}/events`,
  //     duplicateEvent,
  //     {
  //       headers: {
  //         "X-Attendance-Key": API_KEY,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );

  //   // Send duplicate
  //   const response = await axios.post(
  //     `${BASE_URL}/attendance/${schoolSlug}/events`,
  //     duplicateEvent,
  //     {
  //       headers: {
  //         "X-Attendance-Key": API_KEY,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log("✅ Duplicate event handled correctly:");
  //   console.log(JSON.stringify(response.data, null, 2));
  // } catch (error: any) {
  //   if (error.response?.status === 409) {
  //     console.log("✅ Duplicate event rejected with 409 Conflict:");
  //     console.log(JSON.stringify(error.response.data, null, 2));
  //   } else {
  //     console.error("❌ Unexpected error:");
  //     console.error(error.response?.data || error.message);
  //   }
  // }
  // console.log("\n---\n");

  // Test 4: Get all events (requires JWT)
  console.log("📥 Test 4: Fetching all events...");
  try {
    const response = await axios.get(
      `${BASE_URL}/attendance/events?page=1&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );
    console.log("✅ Events retrieved successfully:");
    console.log(`Total: ${response.data.data.pagination.total}`);
    console.log(`Events on page 1: ${response.data.data.events.length}`);
    console.log("\nFirst event:");
    console.log(JSON.stringify(response.data.data.events[0], null, 2));
  } catch (error: any) {
    console.error("❌ Failed to fetch events:");
    console.error(error.response?.data || error.message);
  }
  console.log("\n---\n");

  // Test 5: Get event statistics
  console.log("📊 Test 5: Fetching event statistics...");
  try {
    const response = await axios.get(`${BASE_URL}/attendance/events/stats`, {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    });
    console.log("✅ Statistics retrieved successfully:");
    console.log(JSON.stringify(response.data.data, null, 2));
  } catch (error: any) {
    console.error("❌ Failed to fetch statistics:");
    console.error(error.response?.data || error.message);
  }
  console.log("\n---\n");

  // Test 6: Get attendance suggestions
  console.log(
    "💡 Test 6: Getting attendance suggestions from camera events..."
  );
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await axios.get(
      `${BASE_URL}/attendance/suggest?date=${today}&grade=10&section=A`,
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );
    console.log("✅ Suggestions retrieved successfully:");
    console.log(`Total suggestions: ${response.data.data.length}`);
    if (response.data.data.length > 0) {
      console.log("\nFirst suggestion:");
      console.log(JSON.stringify(response.data.data[0], null, 2));
    }
  } catch (error: any) {
    console.error("❌ Failed to get suggestions:");
    console.error(error.response?.data || error.message);
  }
  console.log("\n---\n");

  // Test 7: Get reconciliation report
  console.log("🔄 Test 7: Getting reconciliation report...");
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await axios.get(
      `${BASE_URL}/attendance/reconcile?date=${today}&grade=10&section=A`,
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );
    console.log("✅ Reconciliation report generated:");
    console.log(JSON.stringify(response.data.data.summary, null, 2));
    console.log(
      `\nDiscrepancies found: ${response.data.data.discrepancies.length}`
    );
  } catch (error: any) {
    console.error("❌ Failed to get reconciliation report:");
    console.error(error.response?.data || error.message);
  }
  console.log("\n---\n");

  console.log("🎉 Auto-Attend integration tests completed!\n");
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAutoAttendIntegration().catch((error) => {
    console.error("Fatal error running tests:", error);
    process.exit(1);
  });
}

export { testAutoAttendIntegration, createTestEvent };
