import React, { useState } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Users, School, Activity, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const SystemReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const reportData = {
    overview: {
      totalUsers: 15420,
      totalSchools: 48,
      activeStudents: 12450,
      systemUptime: 99.8
    },
    growth: {
      usersGrowth: 12.5,
      schoolsGrowth: 8.3,
      studentsGrowth: 15.2
    },
    recentActivity: [
      { action: 'New school registered', school: 'Sunrise Academy', time: '2 hours ago' },
      { action: 'Bulk student enrollment', school: 'Green Valley High', time: '4 hours ago' },
      { action: 'System maintenance completed', school: 'All Systems', time: '1 day ago' },
      { action: 'New admin user created', school: 'Riverside Elementary', time: '2 days ago' }
    ]
  };

  const reportTypes = [
    {
      title: 'User Analytics Report',
      description: 'Comprehensive analysis of user engagement and activity patterns',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      metrics: ['Active Users', 'Login Frequency', 'Role Distribution', 'Geographic Spread']
    },
    {
      title: 'School Performance Report',
      description: 'Academic and operational performance metrics across all schools',
      icon: School,
      color: 'from-green-500 to-green-600',
      metrics: ['Enrollment Rates', 'Academic Results', 'Resource Utilization', 'Staff Performance']
    },
    {
      title: 'System Health Report',
      description: 'Technical infrastructure and system performance analysis',
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      metrics: ['Uptime Statistics', 'Response Times', 'Error Rates', 'Resource Usage']
    },
    {
      title: 'Financial Overview Report',
      description: 'Revenue, costs, and financial trends across the platform',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      metrics: ['Revenue Growth', 'Cost Analysis', 'Subscription Metrics', 'Payment Trends']
    }
  ];

  const generateReport = (_reportType: string) => {
    // TODO: Implement actual report generation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Reports</h1>
            <p className="text-gray-600">Comprehensive analytics and insights across all organizations</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
              <option value="quarterly">Last 3 Months</option>
              <option value="yearly">Last Year</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{reportData.overview.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+{reportData.growth.usersGrowth}%</span>
                  </div>
                </div>
                <Users className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Total Schools</p>
                  <p className="text-3xl font-bold">{reportData.overview.totalSchools}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+{reportData.growth.schoolsGrowth}%</span>
                  </div>
                </div>
                <School className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Active Students</p>
                  <p className="text-3xl font-bold">{reportData.overview.activeStudents.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+{reportData.growth.studentsGrowth}%</span>
                  </div>
                </div>
                <Activity className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">System Uptime</p>
                  <p className="text-3xl font-bold">{reportData.overview.systemUptime}%</p>
                  <div className="flex items-center mt-2">
                    <div className="w-4 h-4 bg-green-400 rounded-full mr-1"></div>
                    <span className="text-sm">Excellent</span>
                  </div>
                </div>
                <BarChart3 className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Report Generation */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Generate Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {reportTypes.map((report, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${report.color} rounded-lg flex items-center justify-center`}>
                          <report.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{report.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Includes:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.metrics.map((metric, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => generateReport(report.title)}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Interactive charts and graphs would appear here</p>
                    <p className="text-sm text-gray-500 mt-2">Showing {selectedPeriod} data trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Recent System Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.school}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Custom Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemReports;