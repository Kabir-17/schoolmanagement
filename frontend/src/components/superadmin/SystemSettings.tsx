import React, { useState, useEffect } from 'react';
import {
  Save,
  Settings,
  Database,
  Mail,
  Shield,
  Globe,
  Bell,
  Key,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiService } from '@/services';
import { usePublicConfig } from '@/hooks/usePublicConfig';

interface SystemSettingsConfig {
  general: {
    siteName: string;
    siteUrl: string;
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorRequired: boolean;
    passwordComplexity: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    attendanceReminders: boolean;
    feeReminders: boolean;
    examNotifications: boolean;
  };
  database: {
    backupFrequency: string;
    retentionPeriod: number;
    enableAutoBackup: boolean;
    maxFileSize: number;
  };
  api: {
    rateLimit: number;
    enableApiLogging: boolean;
    apiTimeout: number;
    allowedOrigins: string[];
  };
}

interface SystemSettingsProps {
  onUpdate?: () => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ onUpdate }) => {
  const [settings, setSettings] = useState<SystemSettingsConfig>({
    general: {
      siteName: 'EDUNETGN',
      siteUrl: 'https://sms.example.com',
      timezone: 'UTC',
      language: 'English',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorRequired: false,
      passwordComplexity: true,
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@sms.example.com',
      fromName: 'SMS System',
      enableEmailNotifications: true,
    },
    notifications: {
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      attendanceReminders: true,
      feeReminders: true,
      examNotifications: true,
    },
    database: {
      backupFrequency: 'daily',
      retentionPeriod: 30,
      enableAutoBackup: true,
      maxFileSize: 100,
    },
    api: {
      rateLimit: 1000,
      enableApiLogging: true,
      apiTimeout: 30,
      allowedOrigins: ['*'],
    },
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { config: publicConfig } = usePublicConfig();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (publicConfig?.timezone) {
      setSettings(prev => ({
        ...prev,
        general: {
          ...prev.general,
          timezone: publicConfig.timezone,
        },
      }));
    }
  }, [publicConfig]);

  const loadSettings = async () => {
    try {
      const response = await apiService.superadmin.getSystemSettings();
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
      // Keep default settings
    }
  };

  const handleInputChange = (section: keyof SystemSettingsConfig, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const validateSettings = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!settings.general.siteName.trim()) {
      newErrors.siteName = 'Site name is required';
    }

    if (!settings.general.siteUrl.trim()) {
      newErrors.siteUrl = 'Site URL is required';
    } else if (!/^https?:\/\/.+/.test(settings.general.siteUrl)) {
      newErrors.siteUrl = 'Invalid URL format';
    }

    if (settings.security.passwordMinLength < 6) {
      newErrors.passwordMinLength = 'Minimum password length must be at least 6';
    }

    if (settings.email.enableEmailNotifications) {
      if (!settings.email.smtpHost.trim()) {
        newErrors.smtpHost = 'SMTP host is required when email is enabled';
      }
      if (!settings.email.fromEmail.trim()) {
        newErrors.fromEmail = 'From email is required when email is enabled';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    setLoading(true);
    try {
      await apiService.superadmin.updateSystemSettings(settings as any);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrors({ submit: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'api', label: 'API', icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure system-wide settings and preferences</p>
      </div>

      <div className="flex space-x-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic system configuration and localization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Name
                    </label>
                    <Input
                      value={settings.general.siteName}
                      onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                      placeholder="School Management System"
                      className={errors.siteName ? 'border-red-500' : ''}
                    />
                    {errors.siteName && <p className="text-red-500 text-xs mt-1">{errors.siteName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site URL
                    </label>
                    <Input
                      value={settings.general.siteUrl}
                      onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                      placeholder="https://sms.example.com"
                      className={errors.siteUrl ? 'border-red-500' : ''}
                    />
                    {errors.siteUrl && <p className="text-red-500 text-xs mt-1">{errors.siteUrl}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <Input
                      value={settings.general.timezone}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Managed centrally. Update the system configuration to change the active timezone.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select aria-label='Language'
                      value={settings.general.language}
                      onChange={(e) => handleInputChange('general', 'language', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select aria-label='Currency'
                      value={settings.general.currency}
                      onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select aria-label='Date Format'
                      value={settings.general.dateFormat}
                      onChange={(e) => handleInputChange('general', 'dateFormat', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Password Length
                    </label>
                    <Input
                      type="number"
                      min="6"
                      max="20"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      className={errors.passwordMinLength ? 'border-red-500' : ''}
                    />
                    {errors.passwordMinLength && <p className="text-red-500 text-xs mt-1">{errors.passwordMinLength}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <Input
                      type="number"
                      min="5"
                      max="120"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Login Attempts
                    </label>
                    <Input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="twoFactorRequired"
                        checked={settings.security.twoFactorRequired}
                        onChange={(e) => handleInputChange('security', 'twoFactorRequired', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="twoFactorRequired" className="ml-2 text-sm text-gray-700">
                        Require Two-Factor Authentication
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="passwordComplexity"
                        checked={settings.security.passwordComplexity}
                        onChange={(e) => handleInputChange('security', 'passwordComplexity', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="passwordComplexity" className="ml-2 text-sm text-gray-700">
                        Enforce Password Complexity
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="enableEmailNotifications"
                    checked={settings.email.enableEmailNotifications}
                    onChange={(e) => handleInputChange('email', 'enableEmailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableEmailNotifications" className="ml-2 text-sm font-medium text-gray-700">
                    Enable Email Notifications
                  </label>
                </div>

                {settings.email.enableEmailNotifications && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Host
                      </label>
                      <Input
                        value={settings.email.smtpHost}
                        onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                        className={errors.smtpHost ? 'border-red-500' : ''}
                      />
                      {errors.smtpHost && <p className="text-red-500 text-xs mt-1">{errors.smtpHost}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Port
                      </label>
                      <Input
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                        placeholder="587"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Username
                      </label>
                      <Input
                        value={settings.email.smtpUser}
                        onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
                        placeholder="username@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Password
                      </label>
                      <Input
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                        placeholder="App password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Email
                      </label>
                      <Input
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => handleInputChange('email', 'fromEmail', e.target.value)}
                        placeholder="noreply@sms.example.com"
                        className={errors.fromEmail ? 'border-red-500' : ''}
                      />
                      {errors.fromEmail && <p className="text-red-500 text-xs mt-1">{errors.fromEmail}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Name
                      </label>
                      <Input
                        value={settings.email.fromName}
                        onChange={(e) => handleInputChange('email', 'fromName', e.target.value)}
                        placeholder="SMS System"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            {errors.submit && (
              <p className="text-red-500 text-sm mr-auto">{errors.submit}</p>
            )}
            <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
