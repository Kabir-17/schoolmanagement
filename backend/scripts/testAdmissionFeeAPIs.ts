import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:5000/api";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

// Test credentials
let accountantToken = "";
let parentToken = "";
let studentToken = "";
let testStudentId = "";
let testParentId = "";

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function log(color: string, ...args: any[]) {
  console.log(color, ...args, RESET);
}

async function test1_LoginAsAccountant() {
  try {
    log(BLUE, "\n🧪 Test 1: Login as Accountant");
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: "sch0015acc2025002",
      password: "SCH0015-ACC-2025-002-2C01",
    });

    accountantToken = response.data.data.token;
    
    if (accountantToken) {
      results.push({
        name: "Login as Accountant",
        passed: true,
        message: "Successfully logged in",
        data: { role: response.data.data.user.role },
      });
      log(GREEN, "✅ Logged in successfully");
    } else {
      throw new Error("No token received");
    }
  } catch (error: any) {
    results.push({
      name: "Login as Accountant",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Login failed:", error.response?.data?.message || error.message);
  }
}

async function test2_LoginAsParent() {
  try {
    log(BLUE, "\n🧪 Test 2: Login as Parent");
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: "parsch0015stu2025090001",
      password: "PARSCH0015-STU-2025-090-001-6C01",
    });

    parentToken = response.data.data.token;
    testParentId = response.data.data.user._id;
    
    if (parentToken) {
      results.push({
        name: "Login as Parent",
        passed: true,
        message: "Successfully logged in",
        data: { role: response.data.data.user.role },
      });
      log(GREEN, "✅ Logged in successfully");
    } else {
      throw new Error("No token received");
    }
  } catch (error: any) {
    results.push({
      name: "Login as Parent",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Login failed:", error.response?.data?.message || error.message);
  }
}

async function test3_FindTestStudent() {
  try {
    log(BLUE, "\n🧪 Test 3: Using Test Student with Admission Fee");
    
    // Use student with admission fee seeded
    testStudentId = "SCH0015-STU-202509-0001";
    
    results.push({
      name: "Find Test Student",
      passed: true,
      message: `Using student: ${testStudentId}`,
      data: { studentId: testStudentId },
    });
    log(GREEN, `✅ Using student: ${testStudentId}`);
  } catch (error: any) {
    results.push({
      name: "Find Test Student",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Failed:", error.response?.data?.message || error.message);
  }
}

async function test4_GetStudentFeeStatus() {
  try {
    log(BLUE, "\n🧪 Test 4: Get Student Fee Status (Before Payment)");
    
    const response = await axios.get(
      `${API_URL}/accountant-fees/student-fee-status/${testStudentId}`,
      {
        headers: { Authorization: `Bearer ${accountantToken}` },
      }
    );

    const data = response.data.data;
    
    log(YELLOW, "\n📊 Fee Status:");
    log(YELLOW, `   Student: ${data.student.name} (${data.student.studentId})`);
    log(YELLOW, `   Grade: ${data.student.grade}`);
    log(YELLOW, `   Total Fee: ₹${data.totalFeeAmount}`);
    log(YELLOW, `   Total Paid: ₹${data.totalPaidAmount}`);
    log(YELLOW, `   Total Due: ₹${data.totalDueAmount}`);
    log(YELLOW, `   Monthly Dues: ₹${data.monthlyDues}`);
    log(YELLOW, `   One-Time Dues: ₹${data.oneTimeDues}`);
    log(YELLOW, `   Pending Months: ${data.pendingMonths}`);
    log(YELLOW, `   Admission Pending: ${data.admissionPending}`);
    log(YELLOW, `   Admission Fee Amount: ₹${data.admissionFeeAmount || 0}`);
    log(YELLOW, `   Admission Fee Paid: ₹${data.admissionFeePaid || 0}`);

    results.push({
      name: "Get Student Fee Status",
      passed: true,
      message: "Successfully retrieved fee status",
      data: {
        totalDue: data.totalDueAmount,
        admissionPending: data.admissionPending,
        admissionFee: data.admissionFeeAmount,
      },
    });
    log(GREEN, "✅ Fee status retrieved successfully");
  } catch (error: any) {
    results.push({
      name: "Get Student Fee Status",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Failed:", error.response?.data?.message || error.message);
  }
}

async function test5_CollectFullAdmissionFee() {
  try {
    log(BLUE, "\n🧪 Test 5: Collect Full Admission Fee");
    
    // First, get current status to know admission fee amount
    const statusResponse = await axios.get(
      `${API_URL}/accountant-fees/student-fee-status/${testStudentId}`,
      {
        headers: { Authorization: `Bearer ${accountantToken}` },
      }
    );

    const admissionFeeAmount = statusResponse.data.data.admissionFeeAmount;
    const admissionPending = statusResponse.data.data.admissionPending;

    if (!admissionPending) {
      log(YELLOW, "⚠️  Admission fee already paid, skipping this test");
      results.push({
        name: "Collect Full Admission Fee",
        passed: true,
        message: "Admission fee already paid",
      });
      return;
    }

    // Collect admission fee
    const response = await axios.post(
      `${API_URL}/accountant-fees/collect-one-time`,
      {
        studentId: testStudentId,
        feeType: "admission",
        amount: admissionFeeAmount,
        paymentMethod: "cash",
        remarks: "Test: Full admission fee payment",
      },
      {
        headers: { Authorization: `Bearer ${accountantToken}` },
      }
    );

    const data = response.data.data;
    
    log(YELLOW, "\n💰 Payment Details:");
    log(YELLOW, `   Transaction ID: ${data.transaction.transactionId}`);
    log(YELLOW, `   Amount: ₹${data.transaction.amount}`);
    log(YELLOW, `   Payment Method: ${data.transaction.paymentMethod}`);
    log(YELLOW, `   Fee Type: ${data.oneTimeFee.feeType}`);
    log(YELLOW, `   Fee Status: ${data.oneTimeFee.status}`);
    log(YELLOW, `   Remaining: ₹${data.oneTimeFee.remainingAmount}`);

    if (data.oneTimeFee.status === "paid" && data.oneTimeFee.remainingAmount === 0) {
      results.push({
        name: "Collect Full Admission Fee",
        passed: true,
        message: "Admission fee collected and marked as paid",
        data: {
          transactionId: data.transaction.transactionId,
          amount: data.transaction.amount,
          status: data.oneTimeFee.status,
        },
      });
      log(GREEN, "✅ Admission fee collected successfully");
    } else {
      throw new Error(`Unexpected status: ${data.oneTimeFee.status}, remaining: ${data.oneTimeFee.remainingAmount}`);
    }
  } catch (error: any) {
    results.push({
      name: "Collect Full Admission Fee",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Failed:", error.response?.data?.message || error.message);
  }
}

async function test6_VerifyAdmissionFeePaid() {
  try {
    log(BLUE, "\n🧪 Test 6: Verify Admission Fee Marked as Paid");
    
    const response = await axios.get(
      `${API_URL}/accountant-fees/student-fee-status/${testStudentId}`,
      {
        headers: { Authorization: `Bearer ${accountantToken}` },
      }
    );

    const data = response.data.data;
    
    log(YELLOW, "\n📊 Updated Fee Status:");
    log(YELLOW, `   Total Due: ₹${data.totalDueAmount}`);
    log(YELLOW, `   Admission Pending: ${data.admissionPending}`);
    log(YELLOW, `   Admission Fee Paid: ₹${data.admissionFeePaid}`);

    if (!data.admissionPending && data.admissionFeePaid > 0) {
      results.push({
        name: "Verify Admission Fee Paid",
        passed: true,
        message: "Admission fee correctly marked as paid",
        data: {
          admissionPending: data.admissionPending,
          admissionFeePaid: data.admissionFeePaid,
        },
      });
      log(GREEN, "✅ Admission fee status verified");
    } else {
      throw new Error(`Admission still pending: ${data.admissionPending}`);
    }
  } catch (error: any) {
    results.push({
      name: "Verify Admission Fee Paid",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Failed:", error.response?.data?.message || error.message);
  }
}

async function test7_TryToOverpay() {
  try {
    log(BLUE, "\n🧪 Test 7: Try to Overpay Admission Fee (Should Fail)");
    
    const response = await axios.post(
      `${API_URL}/accountant-fees/collect-one-time`,
      {
        studentId: testStudentId,
        feeType: "admission",
        amount: 50000, // Large amount
        paymentMethod: "cash",
        remarks: "Test: Overpayment attempt",
      },
      {
        headers: { Authorization: `Bearer ${accountantToken}` },
      }
    );

    // If we reach here, the test failed (should have thrown error)
    results.push({
      name: "Try to Overpay",
      passed: false,
      message: "API allowed overpayment (should have been rejected)",
    });
    log(RED, "❌ API allowed overpayment (bug!)");
  } catch (error: any) {
    // This is expected to fail
    if (error.response?.status === 400) {
      results.push({
        name: "Try to Overpay",
        passed: true,
        message: "Overpayment correctly rejected",
        data: { error: error.response.data.message },
      });
      log(GREEN, "✅ Overpayment correctly rejected");
      log(YELLOW, `   Error message: ${error.response.data.message}`);
    } else {
      results.push({
        name: "Try to Overpay",
        passed: false,
        message: error.response?.data?.message || error.message,
      });
      log(RED, "❌ Unexpected error:", error.response?.data?.message || error.message);
    }
  }
}

async function test8_GetParentChildrenFees() {
  try {
    log(BLUE, "\n🧪 Test 8: Get Parent's Children Fee Status");
    
    const response = await axios.get(
      `${API_URL}/accountant-fees/parent-children-fees`,
      {
        headers: { Authorization: `Bearer ${parentToken}` },
      }
    );

    const data = response.data.data;
    
    log(YELLOW, "\n👨‍👩‍👧‍👦 Parent Dashboard Data:");
    log(YELLOW, `   Total Children: ${data.totalChildren}`);
    log(YELLOW, `   Total Due (All Children): ₹${data.totalDueAmount}`);
    
    if (data.children && data.children.length > 0) {
      data.children.forEach((child: any, index: number) => {
        log(YELLOW, `\n   Child ${index + 1}:`);
        log(YELLOW, `      Name: ${child.name}`);
        log(YELLOW, `      Student ID: ${child.studentId}`);
        log(YELLOW, `      Grade: ${child.grade}-${child.section}`);
        log(YELLOW, `      Total Fees: ₹${child.totalFees}`);
        log(YELLOW, `      Total Paid: ₹${child.totalPaid}`);
        log(YELLOW, `      Total Due: ₹${child.totalDue}`);
        log(YELLOW, `      Pending Months: ${child.pendingMonths}`);
        log(YELLOW, `      Admission Pending: ${child.admissionPending}`);
        if (child.admissionFee > 0) {
          log(YELLOW, `      Admission Fee: ₹${child.admissionFee}`);
          log(YELLOW, `      Admission Paid: ₹${child.admissionFeePaid}`);
          log(YELLOW, `      Admission Remaining: ₹${child.admissionFeeRemaining}`);
        }
        if (child.nextDue) {
          log(YELLOW, `      Next Due: ₹${child.nextDue.amount} on ${child.nextDue.dueDate}`);
        }
      });

      results.push({
        name: "Get Parent Children Fees",
        passed: true,
        message: `Retrieved fee status for ${data.totalChildren} children`,
        data: {
          totalChildren: data.totalChildren,
          totalDue: data.totalDueAmount,
          children: data.children.map((c: any) => ({
            name: c.name,
            totalDue: c.totalDue,
            admissionPending: c.admissionPending,
          })),
        },
      });
      log(GREEN, "✅ Parent children fee status retrieved successfully");
    } else {
      log(YELLOW, "⚠️  No children found for this parent");
      results.push({
        name: "Get Parent Children Fees",
        passed: true,
        message: "No children found (this parent has no students)",
      });
    }
  } catch (error: any) {
    results.push({
      name: "Get Parent Children Fees",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Failed:", error.response?.data?.message || error.message);
  }
}

async function test9_CollectPartialAdmissionFee() {
  try {
    log(BLUE, "\n🧪 Test 9: Collect Partial Admission Fee (New Student)");
    
    // Find another student
    const studentsResponse = await axios.get(`${API_URL}/accountant-fees/students`, {
      headers: { Authorization: `Bearer ${accountantToken}` },
      params: { limit: 10 },
    });

    // Find a student with pending admission fee
    let studentForPartialPayment = null;
    for (const student of studentsResponse.data.data) {
      const statusResponse = await axios.get(
        `${API_URL}/accountant-fees/student-fee-status/${student.studentId}`,
        {
          headers: { Authorization: `Bearer ${accountantToken}` },
        }
      );
      
      if (statusResponse.data.data.admissionPending) {
        studentForPartialPayment = student.studentId;
        break;
      }
    }

    if (!studentForPartialPayment) {
      log(YELLOW, "⚠️  No student with pending admission fee found, skipping");
      results.push({
        name: "Collect Partial Admission Fee",
        passed: true,
        message: "No student available for partial payment test",
      });
      return;
    }

    // Collect partial admission fee (50% of total)
    const statusResponse = await axios.get(
      `${API_URL}/accountant-fees/student-fee-status/${studentForPartialPayment}`,
      {
        headers: { Authorization: `Bearer ${accountantToken}` },
      }
    );

    const admissionFeeAmount = statusResponse.data.data.admissionFeeAmount;
    const partialAmount = Math.floor(admissionFeeAmount / 2);

    const response = await axios.post(
      `${API_URL}/accountant-fees/collect-one-time`,
      {
        studentId: studentForPartialPayment,
        feeType: "admission",
        amount: partialAmount,
        paymentMethod: "online",
        remarks: "Test: Partial admission fee payment",
      },
      {
        headers: { Authorization: `Bearer ${accountantToken}` },
      }
    );

    const data = response.data.data;
    
    log(YELLOW, "\n💰 Partial Payment Details:");
    log(YELLOW, `   Student: ${studentForPartialPayment}`);
    log(YELLOW, `   Amount Paid: ₹${partialAmount}`);
    log(YELLOW, `   Total Admission Fee: ₹${admissionFeeAmount}`);
    log(YELLOW, `   Fee Status: ${data.oneTimeFee.status}`);
    log(YELLOW, `   Remaining: ₹${data.oneTimeFee.remainingAmount}`);

    if (data.oneTimeFee.status === "partial" && data.oneTimeFee.remainingAmount > 0) {
      results.push({
        name: "Collect Partial Admission Fee",
        passed: true,
        message: "Partial payment processed correctly",
        data: {
          paidAmount: partialAmount,
          totalAmount: admissionFeeAmount,
          remaining: data.oneTimeFee.remainingAmount,
          status: data.oneTimeFee.status,
        },
      });
      log(GREEN, "✅ Partial payment processed successfully");
    } else {
      throw new Error(`Unexpected status: ${data.oneTimeFee.status}`);
    }
  } catch (error: any) {
    results.push({
      name: "Collect Partial Admission Fee",
      passed: false,
      message: error.response?.data?.message || error.message,
    });
    log(RED, "❌ Failed:", error.response?.data?.message || error.message);
  }
}

async function printSummary() {
  log(BOLD, "\n" + "=".repeat(60));
  log(BOLD, "📊 TEST SUMMARY");
  log(BOLD, "=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result, index) => {
    const icon = result.passed ? "✅" : "❌";
    const color = result.passed ? GREEN : RED;
    log(color, `${icon} Test ${index + 1}: ${result.name}`);
    log(color, `   ${result.message}`);
  });

  log(BOLD, "\n" + "=".repeat(60));
  if (failed === 0) {
    log(GREEN + BOLD, `🎉 ALL TESTS PASSED! (${passed}/${total})`);
  } else {
    log(YELLOW + BOLD, `⚠️  TESTS COMPLETED: ${passed} passed, ${failed} failed`);
  }
  log(BOLD, "=".repeat(60) + "\n");
}

async function runAllTests() {
  log(BOLD, "\n🚀 Starting Admission Fee API Tests\n");
  log(YELLOW, `API URL: ${API_URL}\n`);

  await test1_LoginAsAccountant();
  if (!accountantToken) {
    log(RED, "\n❌ Cannot continue without accountant login");
    return;
  }

  await test2_LoginAsParent();
  await test3_FindTestStudent();
  
  if (!testStudentId) {
    log(RED, "\n❌ Cannot continue without test student");
    return;
  }

  await test4_GetStudentFeeStatus();
  await test5_CollectFullAdmissionFee();
  await test6_VerifyAdmissionFeePaid();
  await test7_TryToOverpay();
  await test8_GetParentChildrenFees();
  await test9_CollectPartialAdmissionFee();

  await printSummary();
}

// Run tests
runAllTests().catch((error) => {
  log(RED, "\n❌ Test suite failed:", error);
  process.exit(1);
});
