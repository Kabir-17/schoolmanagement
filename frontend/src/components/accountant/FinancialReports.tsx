import React, { useState, useEffect } from 'react';
import { apiService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Download, Calendar, TrendingUp, DollarSign } from 'lucide-react';
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
import { Line, Bar, Pie } from 'react-chartjs-2';

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

interface ReportData {
  reportType: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalAmount: number;
    totalTransactions: number;
    averageTransaction: number;
  };
  byPaymentMethod: Array<{
    _id: string;
    totalAmount: number;
    count: number;
  }>;
  dailyBreakdown: Array<{
    _id: { year: number; month: number; day: number };
    totalAmount: number;
    count: number;
  }>;
  byGrade: Array<{
    _id: number;
    totalAmount: number;
    count: number;
  }>;
  topAccountants: Array<{
    _id: string;
    accountantName: string;
    totalAmount: number;
    count: number;
  }>;
}

const FinancialReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params: any = { reportType };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiService.accountant.getFinancialReports(params);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Financial Report'],
      ['Report Type:', reportData.reportType],
      ['Period:', `${new Date(reportData.period.start).toLocaleDateString()} - ${new Date(reportData.period.end).toLocaleDateString()}`],
      [''],
      ['Summary'],
      ['Total Amount:', reportData.summary.totalAmount],
      ['Total Transactions:', reportData.summary.totalTransactions],
      ['Average Transaction:', reportData.summary.averageTransaction],
      [''],
      ['By Payment Method'],
      ['Payment Method', 'Amount', 'Count'],
      ...reportData.byPaymentMethod.map(pm => [pm._id, pm.totalAmount, pm.count]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Chart Data Preparation
  const getDailyChartData = () => {
    if (!reportData || !reportData.dailyBreakdown || reportData.dailyBreakdown.length === 0) return null;

    const labels = reportData.dailyBreakdown.map(
      (d) => `${d._id.day}/${d._id.month}`
    );
    const data = reportData.dailyBreakdown.map((d) => d.totalAmount);

    return {
      labels,
      datasets: [
        {
          label: 'Daily Collections',
          data,
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getPaymentMethodChartData = () => {
    if (!reportData || !reportData.byPaymentMethod || reportData.byPaymentMethod.length === 0) return null;

    const labels = reportData.byPaymentMethod.map((pm) => pm._id.toUpperCase());
    const data = reportData.byPaymentMethod.map((pm) => pm.totalAmount);

    return {
      labels,
      datasets: [
        {
          label: 'Amount by Payment Method',
          data,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(234, 179, 8, 0.8)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getGradeChartData = () => {
    if (!reportData || !reportData.byGrade || reportData.byGrade.length === 0) return null;

    const labels = reportData.byGrade.map((g) => `Grade ${g._id}`);
    const data = reportData.byGrade.map((g) => g.totalAmount);

    return {
      labels,
      datasets: [
        {
          label: 'Collections by Grade',
          data,
          backgroundColor: 'rgba(249, 115, 22, 0.8)',
          borderColor: 'rgb(249, 115, 22)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Financial Reports
          </CardTitle>
          <CardDescription>View comprehensive financial analytics and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={loadReport} className="flex-1 bg-orange-600 hover:bg-orange-700">
                <Calendar className="h-4 w-4 mr-2" />
                Generate
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">Total Collections</div>
                    <div className="text-3xl font-bold text-green-700 mt-2">
                      ₹{reportData.summary.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Total Transactions</div>
                    <div className="text-3xl font-bold text-blue-700 mt-2">
                      {reportData.summary.totalTransactions}
                    </div>
                  </div>
                  <TrendingUp className="h-12 w-12 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 font-medium">Average Transaction</div>
                    <div className="text-3xl font-bold text-purple-700 mt-2">
                      ₹{Math.round(reportData.summary.averageTransaction).toLocaleString()}
                    </div>
                  </div>
                  <Calendar className="h-12 w-12 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Trend</CardTitle>
                <CardDescription>Daily collection amounts over the period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {getDailyChartData() ? (
                    <Line data={getDailyChartData()!} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No transaction data available for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {getPaymentMethodChartData() ? (
                    <Pie data={getPaymentMethodChartData()!} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No payment method data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grade-wise Collections */}
            <Card>
              <CardHeader>
                <CardTitle>Collections by Grade</CardTitle>
                <CardDescription>Fee collection breakdown by grade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {getGradeChartData() ? (
                    <Bar data={getGradeChartData()!} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No grade-wise data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Accountants */}
            <Card>
              <CardHeader>
                <CardTitle>Top Collectors</CardTitle>
                <CardDescription>Accountants with highest collections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topAccountants.map((accountant, index) => (
                    <div key={accountant._id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 text-orange-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{accountant.accountantName}</div>
                          <div className="text-sm text-gray-500">{accountant.count} transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ₹{accountant.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reportData.topAccountants.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Details</CardTitle>
              <CardDescription>Detailed breakdown of collections by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.byPaymentMethod.map((pm) => {
                      const percentage = ((pm.totalAmount / reportData.summary.totalAmount) * 100).toFixed(1);
                      return (
                        <tr key={pm._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {pm._id.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            ₹{pm.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pm.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{Math.round(pm.totalAmount / pm.count).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FinancialReports;
