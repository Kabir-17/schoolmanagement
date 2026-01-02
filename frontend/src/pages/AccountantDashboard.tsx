import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '@/services';
import MobileNavigation from '../components/layout/MobileNavigation';
import AccountantFeeCollection from '../components/accountant/AccountantFeeCollection';
import TransactionManagement from '../components/accountant/TransactionManagement';
import DefaulterManagement from '../components/accountant/DefaulterManagement';
import FinancialReports from '../components/accountant/FinancialReports';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AccountantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { href: '/accountant', label: 'Dashboard' },
    { href: '/accountant/collect-fee', label: 'Collect Fee' },
    { href: '/accountant/transactions', label: 'Transactions' },
    { href: '/accountant/defaulters', label: 'Defaulters' },
    { href: '/accountant/reports', label: 'Reports' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <MobileNavigation
        title="Accountant Dashboard"
        subtitle={`Welcome back, ${user?.fullName}`}
        navItems={navItems}
        onLogout={handleLogout}
        primaryColor="orange"
      />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<AccountantHome dashboardData={dashboardData} />} />
          <Route path="/collect-fee" element={<AccountantFeeCollection />} />
          <Route path="/transactions" element={<TransactionManagement />} />
          <Route path="/defaulters" element={<DefaulterManagement />} />
          <Route path="/reports" element={<FinancialReports />} />
        </Routes>
      </main>
    </div>
  );
};

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

const AccountantHome: React.FC<{ dashboardData: any }> = ({ dashboardData }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  useEffect(() => {
    if (showStudentList) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedSection, showStudentList]);

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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "0";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Collections</p>
                <p className="text-2xl font-bold text-gray-900">₹{dashboardData?.totalCollections || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Monthly Target</p>
                <p className="text-2xl font-bold text-gray-900">₹{dashboardData?.monthlyTarget || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending Dues</p>
                <p className="text-2xl font-bold text-gray-900">₹{dashboardData?.pendingDues || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Defaulters</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.totalDefaulters || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Today vs Monthly Collection Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Collection Overview</h3>
            <div className="h-[280px]">
              <Bar
                data={{
                  labels: ['Today', 'This Month'],
                  datasets: [
                    {
                      label: 'Collections',
                      data: [
                        dashboardData?.todayTransactions || 0,
                        dashboardData?.monthlyTransactions || 0
                      ],
                      backgroundColor: [
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                      ],
                      borderColor: [
                        'rgb(249, 115, 22)',
                        'rgb(59, 130, 246)',
                      ],
                      borderWidth: 2,
                    },
                    {
                      label: 'Target',
                      data: [
                        0, // No daily target
                        dashboardData?.monthlyTarget || 0
                      ],
                      backgroundColor: 'rgba(156, 163, 175, 0.5)',
                      borderColor: 'rgb(156, 163, 175)',
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ₹' + formatCurrency(context.parsed.y);
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + formatCurrency(Number(value));
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Collection Status Doughnut */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Collection Status</h3>
            <div className="h-[280px] flex items-center justify-center">
              <Doughnut
                data={{
                  labels: ['Collected', 'Pending Dues', 'Defaulters'],
                  datasets: [
                    {
                      data: [
                        dashboardData?.totalCollections || 0,
                        (dashboardData?.pendingDues || 0) - (dashboardData?.totalDefaulters || 0) * 1000, // Approximate
                        (dashboardData?.totalDefaulters || 0) * 1000, // Approximate overdue
                      ],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                      ],
                      borderColor: [
                        'rgb(34, 197, 94)',
                        'rgb(251, 191, 36)',
                        'rgb(239, 68, 68)',
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.parsed;
                          return label + ': ₹' + formatCurrency(value);
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Transactions and Monthly Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {dashboardData?.recentTransactions?.slice(0, 5).map((transaction: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.studentName}</p>
                    <p className="text-xs text-gray-500">{transaction.studentId} • {new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">₹{formatCurrency(transaction.amount)}</span>
                </div>
              )) || (
                <p className="text-gray-500">No recent transactions.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Collection by Type</h3>
            <div className="h-[240px]">
              <Bar
                data={{
                  labels: ['Tuition', 'Exam', 'Transport', 'Other'],
                  datasets: [
                    {
                      label: 'Amount Collected',
                      data: [
                        dashboardData?.tuitionCollection || 0,
                        dashboardData?.examCollection || 0,
                        dashboardData?.transportCollection || 0,
                        dashboardData?.otherCollection || 0,
                      ],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                      ],
                      borderColor: [
                        'rgb(34, 197, 94)',
                        'rgb(59, 130, 246)',
                        'rgb(251, 191, 36)',
                        'rgb(168, 85, 247)',
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return 'Amount: ₹' + formatCurrency(context.parsed.y);
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + formatCurrency(Number(value));
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/accountant/collect-fee" 
              className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 hover:scale-105 text-center block"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Collect Fee
              </div>
            </Link>
            
            <Link 
              to="/accountant/transactions" 
              className="group bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 hover:scale-105 text-center block"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Transactions
              </div>
            </Link>
            
            <Link 
              to="/accountant/defaulters" 
              className="group bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 hover:scale-105 text-center block"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Check Defaulters
              </div>
            </Link>
            
            <Link 
              to="/accountant/reports" 
              className="group bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 hover:scale-105 text-center block"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Report
              </div>
            </Link>
          </div>
        </div>

        {/* Student List Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Student Fee Collection</h3>
            <button
              onClick={() => setShowStudentList(!showStudentList)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all duration-200"
            >
              {showStudentList ? 'Hide Students' : 'Show Students'}
            </button>
          </div>

          {showStudentList && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name or Student ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">All Grades</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">All Sections</option>
                    {['A', 'B', 'C', 'D', 'E'].map(section => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student List */}
              {studentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading students...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student._id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-base font-semibold text-gray-900">{student.name}</p>
                              <span className={`text-xs px-2 py-1 rounded-md ${
                                student.feeStatus?.status === 'paid' 
                                  ? 'bg-green-100 text-green-700'
                                  : student.feeStatus?.status === 'overdue'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {student.feeStatus?.status || 'pending'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{student.studentId}</span>
                              <span>•</span>
                              <span>Grade {student.grade} {student.section}</span>
                              <span>•</span>
                              <span>Roll #{student.rollNumber}</span>
                            </div>
                            {student.feeStatus && (
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="text-green-600">Paid: ₹{formatCurrency(student.feeStatus.totalPaidAmount)}</span>
                                <span className="text-orange-600">Due: ₹{formatCurrency(student.feeStatus.totalDueAmount)}</span>
                                <span className="text-red-600">Pending: {student.feeStatus.pendingMonths} months</span>
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/accountant/collect-fee?studentId=${student.studentId}`}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                          >
                            Collect Fee
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500">No students found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;