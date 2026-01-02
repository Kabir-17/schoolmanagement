import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Building, 
  Users, 
  Settings, 
  Save, 
  RefreshCw,
  Clock,
  Globe,
  DollarSign,
  GraduationCap,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { adminApi } from '@/services/admin.api';
import { usePublicConfig } from '@/hooks/usePublicConfig';

interface SchoolSettings {
  id?: string;
  name: string;
  establishedYear?: number;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  affiliation?: string;
  recognition?: string;
  settings: {
    maxStudentsPerSection: number;
    grades: number[];
    sections: string[];
    timezone: string;
    language: string;
    currency: string;
    academicYearStart: number;
    academicYearEnd: number;
    attendanceGracePeriod: number;
    maxPeriodsPerDay: number;
    attendanceLockAfterDays: number;
    maxAttendanceEditHours: number;
    autoAttendFinalizationTime: string;
  };
  sectionCapacity: {
    [key: string]: { // Format: "grade-section" e.g., "1-A", "2-B"
      maxStudents: number;
      currentStudents: number;
    };
  };
}

interface SchoolSettingsProps {
  schoolData?: SchoolSettings;
}

const SchoolSettingsComponent: React.FC<SchoolSettingsProps> = ({ schoolData }) => {
  const [formData, setFormData] = useState<SchoolSettings>({
    name: '',
    establishedYear: 2000,
    address: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
    },
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    affiliation: '',
    recognition: '',
    settings: {
      maxStudentsPerSection: 0,
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      sections: ['A', 'B', 'C', 'D'],
      timezone: 'UTC',
      language: 'en',
      currency: 'INR',
      academicYearStart: 4, // April
      academicYearEnd: 3,   // March
      attendanceGracePeriod: 15,
      maxPeriodsPerDay: 8,
      attendanceLockAfterDays: 7,
      maxAttendanceEditHours: 24,
      autoAttendFinalizationTime: '17:00',
    },
    sectionCapacity: {}
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'capacity'>('basic');
  const { showToast } = useToast();
  const { config: publicConfig } = usePublicConfig();
  const globalTimezone = publicConfig?.timezone || 'UTC';

  const loadSchoolData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both school settings and capacity report in parallel
      const [settingsResponse, capacityResponse] = await Promise.all([
        adminApi.getSchoolSettings(),
        adminApi.getSectionCapacityReport()
      ]);
      
      
      if (settingsResponse.data.success) {
        const schoolData = settingsResponse.data.data;
        if (schoolData.settings) {
          schoolData.settings.timezone = globalTimezone;
        }
        
        // Ensure sectionCapacity is properly initialized
        if (!schoolData.sectionCapacity) {
          schoolData.sectionCapacity = {};
        }

        if (!schoolData.settings?.autoAttendFinalizationTime) {
          schoolData.settings.autoAttendFinalizationTime = '17:00';
        }
        
        // Update sectionCapacity with actual student counts from capacity report
        if (capacityResponse.data.success && capacityResponse.data.data.report) {
          const report = capacityResponse.data.data.report;
          report.forEach((item: any) => {
            const key = `${item.grade}-${item.section}`;
            if (schoolData.sectionCapacity[key]) {
              schoolData.sectionCapacity[key].currentStudents = item.currentStudents;
            } else {
              schoolData.sectionCapacity[key] = {
                maxStudents: item.maxCapacity,
                currentStudents: item.currentStudents
              };
            }
          });
        }
        
        setFormData(schoolData);
      }
    } catch (error) {
      console.error('Failed to load school settings:', error);
      showToast('Failed to load school settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, globalTimezone]);

  useEffect(() => {
    if (schoolData) {
      setFormData({
        ...schoolData,
        settings: {
          ...schoolData.settings,
          timezone: globalTimezone,
        },
      });
    } else {
      loadSchoolData();
    }
  }, [schoolData, loadSchoolData, globalTimezone]);

  const handleBasicChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value,
      },
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleGradeToggle = (grade: number) => {
    const currentGrades = formData.settings.grades;
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter((g: number) => g !== grade)
      : [...currentGrades, grade].sort((a: number, b: number) => a - b);
    
    handleSettingsChange('grades', newGrades);
    
    // Update section capacity when grades change
    updateSectionCapacity(newGrades, formData.settings.sections);
  };

  const handleSectionToggle = (section: string) => {
    const currentSections = formData.settings.sections;
    const newSections = currentSections.includes(section)
      ? currentSections.filter((s: string) => s !== section)
      : [...currentSections, section].sort();
    
    handleSettingsChange('sections', newSections);
    
    // Update section capacity when sections change
    updateSectionCapacity(formData.settings.grades, newSections);
  };

  const updateSectionCapacity = (grades: number[], sections: string[]) => {
    const newCapacity: { [key: string]: { maxStudents: number; currentStudents: number } } = {};
    
    grades.forEach(grade => {
      sections.forEach(section => {
        const key = `${grade}-${section}`;
        newCapacity[key] = {
          maxStudents: formData.sectionCapacity?.[key]?.maxStudents || formData.settings.maxStudentsPerSection,
          currentStudents: formData.sectionCapacity?.[key]?.currentStudents || 0
        };
      });
    });

    setFormData(prev => ({
      ...prev,
      sectionCapacity: newCapacity
    }));
  };

  const handleCapacityChange = (gradeSection: string, maxStudents: number) => {
    setFormData(prev => ({
      ...prev,
      sectionCapacity: {
        ...prev.sectionCapacity,
        [gradeSection]: {
          ...prev.sectionCapacity?.[gradeSection],
          maxStudents: maxStudents
        }
      }
    }));
  };

  const handleDefaultCapacityChange = (maxStudents: number) => {
    handleSettingsChange('maxStudentsPerSection', maxStudents);
    
    // Update all existing section capacities to the new default
    const updatedCapacity = { ...formData.sectionCapacity };
    Object.keys(updatedCapacity || {}).forEach(key => {
      if (updatedCapacity[key]?.maxStudents === formData.settings.maxStudentsPerSection) {
        updatedCapacity[key].maxStudents = maxStudents;
      }
    });

    setFormData(prev => ({
      ...prev,
      sectionCapacity: updatedCapacity
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminApi.updateSchoolSettings({
        name: formData.name,
        establishedYear: formData.establishedYear,
        address: formData.address,
        contact: formData.contact,
        affiliation: formData.affiliation,
        recognition: formData.recognition,
        settings: formData.settings
      });
      
      if (response.data.success) {
        setFormData(response.data.data);
        showToast('School settings updated successfully!', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Failed to update school settings:', error);
      showToast(error.response?.data?.message || 'Failed to update school settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === id
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Settings</h1>
          <p className="text-gray-600">Manage your school information and academic configuration</p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Fee Structure Link */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fee Structure Management</h3>
                <p className="text-sm text-gray-600">Configure and manage fee structures for different grades</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/admin/settings/fee-structures'}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Manage Fee Structures →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <TabButton id="basic" label="Basic Info" icon={Building} />
        <TabButton id="academic" label="Academic Settings" icon={GraduationCap} />
        <TabButton id="capacity" label="Section Capacity" icon={Users} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter school name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Established Year
                    </label>
                    <Input
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, establishedYear: parseInt(e.target.value) }))}
                      placeholder="e.g., 1995"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Affiliation
                    </label>
                    <select
                      value={formData.affiliation}
                      onChange={(e) => setFormData(prev => ({ ...prev, affiliation: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select affiliation</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="IB">International Baccalaureate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recognition
                    </label>
                    <Input
                      value={formData.recognition}
                      onChange={(e) => setFormData(prev => ({ ...prev, recognition: e.target.value }))}
                      placeholder="Government recognition details"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={formData.contact.phone}
                      onChange={(e) => handleBasicChange('contact', 'phone', e.target.value)}
                      placeholder="+91-9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={formData.contact.email}
                      onChange={(e) => handleBasicChange('contact', 'email', e.target.value)}
                      placeholder="admin@school.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <Input
                    value={formData.contact.website}
                    onChange={(e) => handleBasicChange('contact', 'website', e.target.value)}
                    placeholder="https://school.edu"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Academic Settings Tab */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Grade & Section Configuration
                </CardTitle>
                <CardDescription>
                  Configure the grades and sections offered by your school
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Grades Offered
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <label key={grade} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.settings.grades.includes(grade)}
                          onChange={() => handleGradeToggle(grade)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Grade {grade}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Sections
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((section) => (
                      <label key={section} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.settings.sections.includes(section)}
                          onChange={() => handleSectionToggle(section)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Section {section}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Default Section Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Students Per Section
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.settings.maxStudentsPerSection}
                    onChange={(e) => handleDefaultCapacityChange(parseInt(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default capacity for new sections</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure school-wide defaults. Active timezone: {globalTimezone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Timezone
                    </label>
                    <Input
                      value={formData.settings.timezone}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Timezone is system-wide and cannot be changed per school.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Globe className="inline w-4 h-4 mr-1" />
                      Language
                    </label>
                    <select
                      value={formData.settings.language}
                      onChange={(e) => handleSettingsChange('language', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="bn">Bengali</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Currency
                    </label>
                    <select
                      value={formData.settings.currency}
                      onChange={(e) => handleSettingsChange('currency', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Periods Per Day
                    </label>
                    <Input
                      type="number"
                      min="4"
                      max="12"
                      value={formData.settings.maxPeriodsPerDay}
                      onChange={(e) => handleSettingsChange('maxPeriodsPerDay', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Attendance Flow Settings
                </CardTitle>
                <CardDescription>
                  Configure how Auto-Attend and classroom attendance interact throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-Attend Finalization Time
                  </label>
                  <Input
                    type="time"
                    value={formData.settings.autoAttendFinalizationTime || '17:00'}
                    onChange={(e) => handleSettingsChange('autoAttendFinalizationTime', e.target.value)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    After this time, students without manual confirmation are automatically marked absent.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance Grace Period (minutes)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.settings.attendanceGracePeriod}
                    onChange={(e) => handleSettingsChange('attendanceGracePeriod', parseInt(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance Lock After Days
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.settings.attendanceLockAfterDays}
                    onChange={(e) => handleSettingsChange('attendanceLockAfterDays', parseInt(e.target.value) || 1)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of days after which attendance records are locked from editing.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Attendance Edit Hours
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="72"
                    value={formData.settings.maxAttendanceEditHours}
                    onChange={(e) => handleSettingsChange('maxAttendanceEditHours', parseInt(e.target.value) || 1)}
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section Capacity Tab */}
        {activeTab === 'capacity' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Section Capacity Management
              </CardTitle>
              <CardDescription>
                Set the maximum number of students for each grade-section combination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {formData.settings.grades.length === 0 || formData.settings.sections.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Available</h3>
                    <p className="text-gray-500 mb-4">
                      Please configure grades and sections in the Academic Settings tab first.
                    </p>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setActiveTab('academic')}
                    >
                      Configure Academic Settings
                    </Button>
                  </div>
                ) : (
                  formData.settings.grades.map(grade => (
                    <div key={grade} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade {grade}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {formData.settings.sections.map(section => {
                          const key = `${grade}-${section}`;
                          const capacity = formData.sectionCapacity?.[key];
                          const currentStudents = capacity?.currentStudents || 0;
                          const maxStudents = capacity?.maxStudents || formData.settings.maxStudentsPerSection;
                          const utilizationPercent = maxStudents > 0 ? (currentStudents / maxStudents) * 100 : 0;

                          return (
                            <div key={key} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">Section {section}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  utilizationPercent > 90 ? 'bg-red-100 text-red-800' :
                                  utilizationPercent > 75 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {utilizationPercent.toFixed(0)}%
                                </span>
                              </div>
                              
                              <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">
                                  Current: {currentStudents} / Max: {maxStudents}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      utilizationPercent > 90 ? 'bg-red-500' :
                                      utilizationPercent > 75 ? 'bg-yellow-500' :
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Max Capacity
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={maxStudents}
                                  onChange={(e) => handleCapacityChange(key, parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

export default SchoolSettingsComponent;
