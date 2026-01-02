import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '@/services';
import { Search, Users, DollarSign, AlertCircle, TrendingUp, FileText, ChevronRight } from 'lucide-react';

interface DashboardData {
  totalCollections: number;
  todayTransactions: number;
  monthlyTarget: number;
  monthlyTransactions: number;
  pendingDues: number;
  totalDefaulters: number;
  recentTransactions: Array<{
    _id: string;
    transactionId: string;
    studentName: string;
    studentId: string;
    grade: number;
    section: string;
    amount: number;
    paymentMethod: string;
    date: string;
    month: number;
  }>;
  tuitionCollection: number;
  examCollection: number;
  transportCollection: number;
  otherCollection: number;
}

interface Student {
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

const AccountantDashboardNew: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showStudentList, setShowStudentList] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (showStudentList) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedSection, showStudentList]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.accountant.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      const params: any = {};
      if (selectedGrade) params.grade = selectedGrade;
      if (selectedSection) params.section = selectedSection;
      
      const response = await apiService.accountant.getStudentsByGradeSection(params);
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCollectFee = (studentId: string) => {
    navigate(`/accountant/collect-fee?studentId=${studentId}`);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "0";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <DollarSign className="w-12 h-12 text-blue-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Accountant Dashboard
              </h1>
              <p className="text-blue-200">Welcome back, {user?.fullName}</p>
            </div>
            <button
              onClick={logout}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Collections */}
          <div className="group relative backdrop-blur-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-300" />
                </div>
                <span className="text-xs text-green-300 font-semibold">TODAY</span>
              </div>
              <p className="text-sm text-green-200 mb-1">Total Collections</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(dashboardData?.totalCollections)}</p>
              <p className="text-xs text-green-300 mt-2">{dashboardData?.todayTransactions || 0} transactions</p>
            </div>
          </div>

          {/* Monthly Collection */}
          <div className="group relative backdrop-blur-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-300" />
                </div>
                <span className="text-xs text-blue-300 font-semibold">MONTH</span>
              </div>
              <p className="text-sm text-blue-200 mb-1">Monthly Target</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(dashboardData?.monthlyTarget)}</p>
              <p className="text-xs text-blue-300 mt-2">{dashboardData?.monthlyTransactions || 0} transactions</p>
            </div>
          </div>

          {/* Pending Dues */}
          <div className="group relative backdrop-blur-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-orange-300" />
                </div>
                <span className="text-xs text-orange-300 font-semibold">PENDING</span>
              </div>
              <p className="text-sm text-orange-200 mb-1">Pending Dues</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(dashboardData?.pendingDues)}</p>
              <p className="text-xs text-orange-300 mt-2">Across all students</p>
            </div>
          </div>

          {/* Defaulters */}
          <div className="group relative backdrop-blur-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-purple-300" />
                </div>
                <span className="text-xs text-purple-300 font-semibold">ALERT</span>
              </div>
              <p className="text-sm text-purple-200 mb-1">Defaulters</p>
              <p className="text-3xl font-bold text-white">{dashboardData?.totalDefaulters || 0}</p>
              <p className="text-xs text-purple-300 mt-2">Students with overdue</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                Recent Transactions
              </h3>
              <button 
                onClick={() => navigate('/accountant/transactions')}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction) => (
                  <div 
                    key={transaction._id}
                    className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{transaction.studentName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-blue-300">{transaction.studentId}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">Grade {transaction.grade} {transaction.section}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md">
                            {transaction.paymentMethod}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">{formatCurrency(transaction.amount)}</p>
                        <p className="text-xs text-gray-400 mt-1">Month {transaction.month}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No recent transactions</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/accountant/collect-fee')}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Collect Fee
                </div>
              </button>

              <button
                onClick={() => setShowStudentList(!showStudentList)}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center">
                  <Users className="w-5 h-5 mr-2" />
                  {showStudentList ? 'Hide' : 'View'} Students
                </div>
              </button>

              <button
                onClick={() => navigate('/accountant/transactions')}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-4 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center">
                  <FileText className="w-5 h-5 mr-2" />
                  View Reports
                </div>
              </button>

              <button
                onClick={() => navigate('/accountant/defaulters')}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Check Defaulters
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Student List Section */}
        {showStudentList && (
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-400" />
              Student Fee Collection
            </h3>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name or Student ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Grades</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                    <option key={grade} value={grade} className="bg-slate-800">Grade {grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sections</option>
                  {['A', 'B', 'C', 'D', 'E'].map(section => (
                    <option key={section} value={section} className="bg-slate-800">Section {section}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student List */}
            {studentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading students...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-base font-semibold text-white">{student.name}</p>
                            <span className={`text-xs px-2 py-1 rounded-md ${
                              student.feeStatus?.status === 'paid' 
                                ? 'bg-green-500/20 text-green-300'
                                : student.feeStatus?.status === 'overdue'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {student.feeStatus?.status || 'pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-300">{student.studentId}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">Grade {student.grade} {student.section}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">Roll #{student.rollNumber}</span>
                          </div>
                          {student.feeStatus && (
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-green-300">Paid: {formatCurrency(student.feeStatus.totalPaidAmount)}</span>
                              {/* <span className="text-orange-300">Due: {formatCurrency(student.feeStatus.totalDueAmount)}</span> */}
                              <span className="text-red-300">Pending: {student.feeStatus.pendingMonths} months</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCollectFee(student.studentId)}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Collect Fee
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No students found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default AccountantDashboardNew;
