import React, { useState, useEffect } from 'react';
import { apiService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Phone, Mail, AlertCircle, Download } from 'lucide-react';

interface Defaulter {
  _id: string;
  studentId: string;
  studentName: string;
  grade: number;
  section: string;
  rollNumber: number;
  parentContact: string;
  totalDueAmount: number;
  totalOverdue: number;
  overdueMonths: number;
  lastPaymentDate: string | null;
  feeStatus: string;
}

const DefaulterManagement: React.FC = () => {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDefaulters();
  }, []);

  const loadDefaulters = async () => {
    try {
      setLoading(true);
      const response = await apiService.accountant.getDefaulters();
      if (response.success) {
        setDefaulters(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load defaulters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDefaulters = defaulters.filter((defaulter) =>
    defaulter.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    defaulter.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    defaulter.parentContact.includes(searchQuery)
  );

  const totalOverdueAmount = filteredDefaulters.reduce((sum, d) => sum + d.totalOverdue, 0);

  const handleExport = () => {
    const csvContent = [
      ['Student ID', 'Student Name', 'Class', 'Roll No', 'Parent Contact', 'Total Due', 'Overdue Amount', 'Overdue Months', 'Last Payment', 'Status'],
      ...filteredDefaulters.map(d => [
        d.studentId,
        d.studentName,
        `${d.grade}-${d.section}`,
        d.rollNumber,
        d.parentContact,
        d.totalDueAmount,
        d.totalOverdue,
        d.overdueMonths,
        d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString() : 'Never',
        d.feeStatus
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defaulters_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSendReminder = async (defaulter: Defaulter) => {
    // Implement reminder functionality
    alert(`Sending reminder to ${defaulter.studentName}'s parent at ${defaulter.parentContact}`);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Defaulter Management
          </CardTitle>
          <CardDescription>Students with overdue fee payments</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, student ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Total Defaulters</div>
                <div className="text-3xl font-bold text-red-600">{filteredDefaulters.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Total Overdue Amount</div>
                <div className="text-3xl font-bold text-orange-600">₹{totalOverdueAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">Average Overdue</div>
                <div className="text-3xl font-bold text-yellow-600">
                  ₹{filteredDefaulters.length > 0 ? Math.round(totalOverdueAmount / filteredDefaulters.length).toLocaleString() : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Defaulter List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Defaulter List</h3>
            {filteredDefaulters.map((defaulter) => (
              <Card key={defaulter._id} className="border-l-4 border-l-red-500">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Student Info */}
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-lg text-gray-900">{defaulter.studentName}</h4>
                      <div className="text-sm text-gray-600 space-y-1 mt-2">
                        <div>Student ID: {defaulter.studentId}</div>
                        <div>Class: {defaulter.grade}-{defaulter.section} | Roll No: {defaulter.rollNumber}</div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {defaulter.parentContact || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-500">Total Due</div>
                          <div className="text-lg font-semibold text-orange-600">
                            ₹{defaulter.totalDueAmount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Overdue Amount</div>
                          <div className="text-lg font-semibold text-red-600">
                            ₹{defaulter.totalOverdue.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Overdue Months</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {defaulter.overdueMonths}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendReminder(defaulter)}
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.location.href = `/accountant/collect-fee?studentId=${defaulter.studentId}`}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        Collect Fee
                      </Button>
                      <div className="text-xs text-gray-500 text-center mt-2">
                        Last Payment: {defaulter.lastPaymentDate 
                          ? new Date(defaulter.lastPaymentDate).toLocaleDateString() 
                          : 'Never'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDefaulters.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No defaulters found matching your search' : 'No defaulters found! 🎉'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefaulterManagement;
