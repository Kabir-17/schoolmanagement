import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiService } from "@/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  DollarSign,
  AlertCircle,
  Check,
  X,
  Users,
} from "lucide-react";

interface StudentWithFee {
  _id: string;
  studentId: string;
  name: string;
  grade: number;
  section: string;
  rollNumber: number;
  parentContact: string;
  feeStatus: {
    totalFeeAmount: number;
    totalPaidAmount: number;
    totalDueAmount: number;
    status: string;
    pendingMonths: number;
  } | null;
}

interface FeeStatus {
  student: {
    _id: string;
    studentId: string;
    name: string;
    grade: number;
    rollNumber: number;
  };
  feeRecord: any;
  upcomingDue?: {
    month: number;
    amount: number;
    dueDate: Date;
  };
  recentTransactions: any[];
}

const AccountantFeeCollection: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId');

  const [allStudents, setAllStudents] = useState<StudentWithFee[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithFee[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number | "">("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const [selectedStudent, setSelectedStudent] = useState<StudentWithFee | null>(null);
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [loadingFeeStatus, setLoadingFeeStatus] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [includeLateFee, setIncludeLateFee] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationData, setValidationData] = useState<any>(null);
  const [detailedFeeStatus, setDetailedFeeStatus] = useState<any>(null);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "online", label: "Online" },
  ];

  useEffect(() => {
    loadAllStudents();
  }, []);

  useEffect(() => {
    if (preselectedStudentId && allStudents.length > 0) {
      const student = allStudents.find(s => s.studentId === preselectedStudentId);
      if (student) {
        handleSelectStudent(student);
      }
    }
  }, [preselectedStudentId, allStudents]);

  useEffect(() => {
    let filtered = [...allStudents];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query) ||
          student.rollNumber.toString().includes(query)
      );
    }

    if (selectedGrade) {
      filtered = filtered.filter((student) => student.grade === selectedGrade);
    }

    if (selectedSection) {
      filtered = filtered.filter((student) => student.section === selectedSection);
    }

    if (selectedStatus) {
      filtered = filtered.filter(
        (student) => student.feeStatus?.status === selectedStatus
      );
    }

    setFilteredStudents(filtered);
  }, [searchQuery, selectedGrade, selectedSection, selectedStatus, allStudents]);

  const loadAllStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await apiService.accountant.getStudentsByGradeSection({});
      if (response.success) {
        setAllStudents(response.data);
        setFilteredStudents(response.data);
      } else {
        setError("Failed to load students. Please refresh the page.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load students. Please refresh the page.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSelectStudent = async (student: StudentWithFee) => {
    setSelectedStudent(student);
    setError(null);
    setSuccess(null);
    setWarnings([]);

    try {
      setLoadingFeeStatus(true);
      
      // Get basic fee status
      const response = await apiService.accountant.getStudentFeeStatus(
        student._id
      );
      
      if (response.success) {
        setFeeStatus(response.data);

        if (response.data.upcomingDue) {
          setAmount(response.data.upcomingDue.amount);
          setSelectedMonth(response.data.upcomingDue.month);
        }
      }

      // Get detailed fee status (including one-time fees)
      const detailedResponse = await apiService.fee.getStudentFeeStatusDetailed(
        student.studentId
      );
      
      if (detailedResponse.success) {
        setDetailedFeeStatus(detailedResponse.data);
        
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load fee status");
    } finally {
      setLoadingFeeStatus(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      setError(null);
      setWarnings([]);

      const response = await apiService.accountant.validateFeeCollection({
        studentId: selectedStudent._id,
        month: selectedMonth,
        amount: amount,
        includeLateFee: includeLateFee,
      });

      if (response.success) {
        setValidationData(response.data);
        setWarnings(response.data.warnings || []);

        if (response.data.valid) {
          // Auto-set amount if it includes one-time fees or late fees
          const suggestedAmount = response.data.expectedAmount;
          if (amount === 0 || (response.data.isFirstPayment && response.data.totalOneTimeFeeAmount > 0)) {
            setAmount(suggestedAmount);
          }
          setSuccess("Validation successful! You can proceed with collection.");
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError("Cannot proceed: " + (response.data.errors?.join(", ") || "Validation failed"));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = async () => {
    if (!selectedStudent) return;

    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const confirmMessage = validationData?.isFirstPayment && validationData?.totalOneTimeFeeAmount > 0
      ? `Confirm fee collection of ₹${formatCurrency(amount)} for ${selectedStudent.name}?\n\nThis includes:\n- Monthly fee: ₹${formatCurrency(validationData.monthlyExpectedAmount)}\n- One-time fees: ₹${formatCurrency(validationData.totalOneTimeFeeAmount)}`
      : `Confirm fee collection of ₹${formatCurrency(amount)} for ${selectedStudent.name}?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.accountant.collectFee({
          studentId: selectedStudent._id,
          month: selectedMonth,
          amount: amount,
          paymentMethod: paymentMethod,
          remarks: remarks,
          includeLateFee: includeLateFee,
        });

        if (response.success) {
          // Store transaction data for receipt
          setLastTransaction({
            ...response.data.transaction,
            oneTimeFeeTransactions: response.data.oneTimeFeeTransactions,
            student: selectedStudent,
            totalOneTimeFeeAmount: response.data.totalOneTimeFeeAmount,
            isFirstPayment: response.data.isFirstPayment,
          });

          setSuccess(`Fee collected successfully! Transaction ID: ${response.data.transaction?.transactionId || 'N/A'}`);
          setShowReceipt(true);

          // Refresh fee status
          const statusResponse = await apiService.accountant.getStudentFeeStatus(
            selectedStudent._id
          );
          if (statusResponse.success) {
            setFeeStatus(statusResponse.data);
          }

          // Refresh detailed fee status
          const detailedResponse = await apiService.fee.getStudentFeeStatusDetailed(
            selectedStudent.studentId
          );
          
          if (detailedResponse.success) {
            setDetailedFeeStatus(detailedResponse.data);
          }

          loadAllStudents();

          setAmount(0);
          setRemarks("");
          setWarnings([]);
          setValidationData(null);
          setPaymentMethod("cash");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to collect fee");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleClearSelection = () => {
    setSelectedStudent(null);
    setFeeStatus(null);
    setAmount(0);
    setRemarks("");
    setWarnings([]);
    setError(null);
    setSuccess(null);
  };

  const formatCurrency = (amt: number | undefined) => {
    if (amt === undefined || amt === null || isNaN(amt)) return "0";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amt);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Collection</h1>
        <p className="text-gray-600 mt-1">Search and collect fees from students</p>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <ul className="list-disc pl-4">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                All Students ({filteredStudents.length})
              </CardTitle>
              <CardDescription>Search or select a student to collect fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, student ID, or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : "")}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Grades</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Sections</option>
                    {["A", "B", "C", "D", "E"].map((section) => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {studentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading students...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student._id}
                        onClick={() => handleSelectStudent(student)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedStudent?._id === student._id
                            ? "bg-orange-50 border-orange-500 shadow-md"
                            : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              {student.feeStatus && (
                                <span className={`text-xs px-2 py-1 rounded-md ${
                                  student.feeStatus.status === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : student.feeStatus.status === "overdue"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {student.feeStatus.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>{student.studentId}</span>
                              <span>•</span>
                              <span>Grade {student.grade} {student.section}</span>
                              <span>•</span>
                              <span>Roll #{student.rollNumber}</span>
                            </div>
                            {student.feeStatus ? (
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="text-green-600">Paid: ₹{formatCurrency(student.feeStatus.totalPaidAmount)}</span>
                                <span className="text-orange-600">Due: ₹{formatCurrency(student.feeStatus.totalDueAmount)}</span>
                                <span className="text-red-600">Pending: {student.feeStatus.pendingMonths} months</span>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                  No fee structure set for this grade
                                </span>
                              </div>
                            )}
                          </div>
                          {selectedStudent?._id === student._id && (
                            <Check className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No students found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Fee Collection
                </span>
                {selectedStudent && (
                  <button onClick={handleClearSelection} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </CardTitle>
              <CardDescription>
                {selectedStudent ? `Collecting fee for ${selectedStudent.name}` : "Select a student to collect fee"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedStudent ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No student selected</p>
                  <p className="text-sm text-gray-400 mt-1">Click on a student from the list</p>
                </div>
              ) : loadingFeeStatus ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading fee details...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedStudent.studentId} • Grade {selectedStudent.grade} {selectedStudent.section}
                    </p>
                  </div>

                  {/* PROMINENT DUE AMOUNT DISPLAY */}
                  {feeStatus && detailedFeeStatus && (() => {
                    const calculatedTotalDue = 
                      (detailedFeeStatus.monthlyDues || 0) + 
                      (detailedFeeStatus.oneTimeDues || 0) + 
                      (detailedFeeStatus.admissionPending 
                        ? (detailedFeeStatus.admissionFeeAmount - (detailedFeeStatus.admissionFeePaid || 0)) 
                        : 0);
                    return calculatedTotalDue > 0 ? (
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-orange-600 font-medium mb-1">TOTAL DUE AMOUNT</p>
                            <p className="text-3xl font-bold text-orange-700">
                              ₹{formatCurrency(calculatedTotalDue)}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                              {detailedFeeStatus.pendingMonths || 0} month(s) pending
                            </p>
                          </div>
                          <AlertCircle className="h-12 w-12 text-orange-400" />
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {detailedFeeStatus && detailedFeeStatus.admissionPending && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Admission Fee Pending!</strong> ₹{formatCurrency(detailedFeeStatus.admissionFeeAmount - (detailedFeeStatus.admissionFeePaid || 0))} remaining
                      </AlertDescription>
                    </Alert>
                  )}

                  {feeStatus && detailedFeeStatus && (() => {
                    const calculatedTotalDue = 
                      (detailedFeeStatus.monthlyDues || 0) + 
                      (detailedFeeStatus.oneTimeDues || 0) + 
                      (detailedFeeStatus.admissionPending 
                        ? (detailedFeeStatus.admissionFeeAmount - (detailedFeeStatus.admissionFeePaid || 0)) 
                        : 0);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Fee:</span>
                          <span className="font-semibold">₹{formatCurrency(detailedFeeStatus.totalFeeAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Paid:</span>
                          <span className="font-semibold text-green-600">₹{formatCurrency(detailedFeeStatus.totalPaidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Due:</span>
                          <span className="font-semibold text-orange-600">₹{formatCurrency(calculatedTotalDue)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Monthly Dues:</span>
                          <span className="font-semibold text-blue-600">₹{formatCurrency(detailedFeeStatus.monthlyDues)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">One-Time Dues:</span>
                          <span className="font-semibold text-orange-600">₹{formatCurrency(detailedFeeStatus.oneTimeDues)}</span>
                        </div>
                        {detailedFeeStatus.admissionPending && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Admission Due:</span>
                            <span className="font-semibold text-red-600">
                              ₹{formatCurrency(detailedFeeStatus.admissionFeeAmount - (detailedFeeStatus.admissionFeePaid || 0))}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Unified Fee Collection Form */}
                  <div className="border-t pt-4">
                    {validationData?.isFirstPayment && validationData?.totalOneTimeFeeAmount > 0 && (
                      <Alert className="bg-orange-50 border-orange-200 mb-4">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <strong>First Payment Notice:</strong><br/>
                          This is the first payment. One-time fees will be automatically collected.
                          <div className="mt-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Monthly Fee:</span>
                              <span className="font-semibold">₹{formatCurrency(validationData.monthlyExpectedAmount)}</span>
                            </div>
                            {validationData.pendingOneTimeFees && validationData.pendingOneTimeFees.length > 0 && (
                              <>
                                {validationData.pendingOneTimeFees.map((f: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-orange-700">
                                    <span>• {f.feeType}:</span>
                                    <span className="font-semibold">₹{formatCurrency(f.amount)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between font-bold pt-2 border-t border-orange-300">
                                  <span>Total to Pay:</span>
                                  <span>₹{formatCurrency(validationData.expectedAmount)}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {months.map((month, idx) => (
                              <option key={idx + 1} value={idx + 1}>{month}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                          />
                          {validationData?.lateFeeAmount > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              Late fee applicable: ₹{formatCurrency(validationData.lateFeeAmount)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <input
                            type="checkbox"
                            id="includeLateFee"
                            checked={includeLateFee}
                            onChange={(e) => {
                              setIncludeLateFee(e.target.checked);
                              // Reset validation when checkbox changes
                              setValidationData(null);
                              setWarnings([]);
                            }}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <label htmlFor="includeLateFee" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Include Late Fee {validationData?.lateFeeAmount > 0 && `(₹${formatCurrency(validationData.lateFeeAmount)})`}
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {paymentMethods.map((method) => (
                              <option key={method.value} value={method.value}>{method.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                          <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Add any remarks..."
                          />
                        </div>

                      <div className="space-y-2 pt-2">
                        <Button
                          onClick={handleValidate}
                          disabled={loading || !amount}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Validate Payment
                        </Button>
                        <Button
                          onClick={handleCollectFee}
                          disabled={loading || !amount}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                        >
                          {loading ? "Processing..." : "Collect Fee"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white print:shadow-none">
            <CardHeader className="border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Payment Receipt</CardTitle>
                  <CardDescription>Transaction ID: {lastTransaction.transactionId}</CardDescription>
                </div>
                <button 
                  onClick={() => setShowReceipt(false)} 
                  className="text-gray-400 hover:text-gray-600 print:hidden"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* School Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">School Management System</h2>
                <p className="text-sm text-gray-600">Fee Payment Receipt</p>
                <p className="text-xs text-gray-500 mt-1">
                  Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Student Name</p>
                  <p className="font-semibold">{lastTransaction.student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-semibold">{lastTransaction.student.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Grade/Section</p>
                  <p className="font-semibold">
                    Grade {lastTransaction.student.grade} {lastTransaction.student.section}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-semibold">{lastTransaction.student.rollNumber}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Month:</span>
                    <span className="font-medium">{months[lastTransaction.month - 1]}</span>
                  </div>
                  
                  {lastTransaction.isFirstPayment && lastTransaction.oneTimeFeeTransactions?.length > 0 && (
                    <>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 my-3">
                        <p className="font-semibold text-orange-800 mb-2">One-Time Fees Collected:</p>
                        {lastTransaction.oneTimeFeeTransactions.map((txn: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm py-1">
                            <span className="text-gray-700">{txn.feeType}:</span>
                            <span className="font-semibold text-orange-700">₹{formatCurrency(txn.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-orange-800 pt-2 border-t border-orange-300 mt-2">
                          <span>One-Time Total:</span>
                          <span>₹{formatCurrency(lastTransaction.totalOneTimeFeeAmount)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Monthly Fee Amount:</span>
                        <span className="font-medium">₹{formatCurrency(lastTransaction.amount)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{lastTransaction.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  
                  {lastTransaction.remarks && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Remarks:</span>
                      <span className="font-medium">{lastTransaction.remarks}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-3 bg-green-50 border border-green-200 rounded-lg px-4 mt-4">
                    <span className="text-lg font-bold text-green-800">Total Amount Paid:</span>
                    <span className="text-2xl font-bold text-green-700">
                      ₹{formatCurrency(
                        lastTransaction.amount + (lastTransaction.totalOneTimeFeeAmount || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center bg-green-50 border border-green-200 rounded-lg p-3">
                <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Payment Successful</p>
                <p className="text-sm text-green-600">Thank you for your payment!</p>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 border-t pt-4">
                <p>This is a computer-generated receipt. No signature required.</p>
                <p className="mt-1">For any queries, please contact the accounts department.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 print:hidden">
                <Button 
                  onClick={handlePrintReceipt} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Print Receipt
                </Button>
                <Button 
                  onClick={() => setShowReceipt(false)} 
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccountantFeeCollection;
