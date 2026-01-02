import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getFinancialOverview,
  getDefaultersReport,
} from "../../services/fee.api";
import {
  FinancialOverview,
  DefaultersReport,
  TransactionStatus,
} from "../../types/fee.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const FinancialDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialOverview | null>(
    null
  );
  const [defaultersData, setDefaultersData] = useState<DefaultersReport | null>(
    null
  );

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(
    `${currentYear}-${currentYear + 1}`
  );

  // Fetch financial data
  const fetchData = async () => {
    if (!user?.schoolId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch financial overview
      const financialResponse = await getFinancialOverview({
        school: user.schoolId,
        academicYear: selectedYear,
      });

      // Fetch defaulters
      const defaultersResponse = await getDefaultersReport({
        school: user.schoolId,
        limit: 10,
      });

      setFinancialData(financialResponse.data);
      setDefaultersData(defaultersResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, user?.schoolId]);

  // Format currency - without symbol
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0";
    }
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.0%";
    }
    return `${value.toFixed(1)}%`;
  };

  // Get month name
  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString("en", { month: "short" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!financialData || !financialData.overview) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No financial data available</AlertDescription>
      </Alert>
    );
  }

  const { overview, monthlyBreakdown, gradeWiseBreakdown, recentTransactions, defaultersSummary, comparisonWithLastYear } = financialData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Complete overview of fee collection and finances
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`${currentYear - 1}-${currentYear}`}>
                {currentYear - 1}-{currentYear}
              </SelectItem>
              <SelectItem value={`${currentYear}-${currentYear + 1}`}>
                {currentYear}-{currentYear + 1}
              </SelectItem>
              <SelectItem value={`${currentYear + 1}-${currentYear + 2}`}>
                {currentYear + 1}-{currentYear + 2}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Expected Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expected Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(overview.totalExpectedRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Academic Year {selectedYear}
            </p>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Collected
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(overview.totalCollected)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Collection Rate: {formatPercentage(overview.collectionRate)}
            </p>
          </CardContent>
        </Card>

        {/* Total Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Collection
            </CardTitle>
            <Calendar className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(overview.totalPending)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Yet to be collected
            </p>
          </CardContent>
        </Card>

        {/* Total Overdue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue Amount
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overview.totalOverdue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {defaultersSummary?.totalDefaulters || 0} defaulters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Year-over-Year Comparison */}
      {comparisonWithLastYear && (
        <Card>
          <CardHeader>
            <CardTitle>Year-over-Year Growth</CardTitle>
            <CardDescription>
              Comparison with last academic year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Year</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(comparisonWithLastYear.lastYearCollection)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {comparisonWithLastYear.growthPercentage >= 0 ? (
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                <span
                  className={`text-2xl font-bold ${
                    comparisonWithLastYear.growthPercentage >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercentage(Math.abs(comparisonWithLastYear.growthPercentage))}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Year</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(comparisonWithLastYear.currentYearCollection)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Collection Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Collection Trend</CardTitle>
            <CardDescription>
              Month-wise fee collection comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <Line
                data={{
                  labels: monthlyBreakdown.map((m: any) => getMonthName(m.month)),
                  datasets: [
                    {
                      label: 'Collected',
                      data: monthlyBreakdown.map((m: any) => m.collected),
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: 'Expected',
                      data: monthlyBreakdown.map((m: any) => m.expected),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
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
          </CardContent>
        </Card>

        {/* Collection Status Doughnut */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Status</CardTitle>
            <CardDescription>
              Overall fee collection breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center">
              <Doughnut
                data={{
                  labels: ['Collected', 'Pending', 'Overdue'],
                  datasets: [
                    {
                      data: [
                        overview.totalCollected,
                        overview.totalPending - overview.totalOverdue,
                        overview.totalOverdue,
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
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return label + ': ₹' + formatCurrency(value) + ' (' + percentage + '%)';
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade-wise Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grade-wise Collection</CardTitle>
          <CardDescription>Fee collection by grade/class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <Bar
              data={{
                labels: gradeWiseBreakdown.map((g: any) => `Class ${g.grade}`),
                datasets: [
                  {
                    label: 'Collected Amount',
                    data: gradeWiseBreakdown.map((g: any) => g.collected),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                  },
                  {
                    label: 'Expected Amount',
                    data: gradeWiseBreakdown.map((g: any) => g.expected || g.collected / (g.collectionRate / 100)),
                    backgroundColor: 'rgba(156, 163, 175, 0.5)',
                    borderColor: 'rgb(156, 163, 175)',
                    borderWidth: 1,
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
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return label + ': ₹' + formatCurrency(value);
                      },
                      afterLabel: function(context) {
                        const grade = gradeWiseBreakdown[context.dataIndex];
                        return [
                          `Students: ${grade.totalStudents}`,
                          `Collection Rate: ${formatPercentage(grade.collectionRate)}`
                        ];
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
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest fee payments and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No recent transactions
              </p>
            ) : (
              recentTransactions.slice(0, 10).map((transaction: any) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.status === TransactionStatus.COMPLETED
                          ? "bg-green-100 text-green-700"
                          : transaction.status === TransactionStatus.CANCELLED
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.student.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.student.studentId} •{" "}
                        {transaction.receiptNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Defaulters Summary */}
      {defaultersData && defaultersData.summary && defaultersData.summary.bySeverity && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Defaulters</CardTitle>
            <CardDescription>Students with overdue payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">
                  {defaultersData.summary.bySeverity.low || 0}
                </p>
                <p className="text-sm text-gray-600">Low</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">
                  {defaultersData.summary.bySeverity.medium || 0}
                </p>
                <p className="text-sm text-gray-600">Medium</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">
                  {defaultersData.summary.bySeverity.high || 0}
                </p>
                <p className="text-sm text-gray-600">High</p>
              </div>
              <div className="text-center p-3 bg-red-100 rounded-lg">
                <p className="text-2xl font-bold text-red-900">
                  {defaultersData.summary.bySeverity.critical || 0}
                </p>
                <p className="text-sm text-gray-600">Critical</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Full Defaulters Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialDashboard;
