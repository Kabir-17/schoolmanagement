import React, { useState, useEffect } from 'react';
import { X, Save, User, Building, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiService } from '@/services';
import { usePublicConfig } from '@/hooks/usePublicConfig';

interface School {
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
  settings?: {
    maxStudentsPerSection?: number;
    grades?: number[];
    sections?: string[];
    timezone?: string;
    language?: string;
    currency?: string;
  };
  adminDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    username: string;
    password: string;
  };
}

interface SchoolFormProps {
  school?: School | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (school: School) => void;
}

const SchoolForm: React.FC<SchoolFormProps> = ({
  school,
  isOpen,
  onClose,
  onSave,
}) => {
  const { config: publicConfig } = usePublicConfig();
  const [formData, setFormData] = useState<School>({
    name: '',
    establishedYear: 2000, // Set a valid default year
    address: {
      street: '',
      city: '',
      state: '',
      country: 'USA',
      postalCode: '',
    },
    contact: {
      phone: '', // Allow empty phone
      email: '',
      website: '', // Keep empty, we'll handle this in submit
    },
    affiliation: '',
    recognition: '',
    settings: {
      maxStudentsPerSection: 0,
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Default grades
      sections: ['A', 'B', 'C', 'D'], // Default sections
      timezone: 'UTC',
      language: 'en',
      currency: 'INR',
    },
    adminDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '', // Allow empty phone
      username: '',
      password: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const globalTimezone = publicConfig?.timezone || 'UTC';

  useEffect(() => {
    if (school) {
      setFormData({
        ...school,
        settings: {
          ...school.settings,
          timezone: globalTimezone,
        },
      });
    } else {
      // Reset form for new school
      setFormData({
        name: '',
        establishedYear: 2000,
        address: {
          street: '',
          city: '',
          state: '',
          country: 'USA',
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
          grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Default grades
          sections: ['A', 'B', 'C', 'D'], // Default sections
          timezone: globalTimezone,
          language: 'en',
          currency: 'INR',
        },
        adminDetails: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          username: '',
          password: '',
        },
      });
    }
  }, [school, isOpen, globalTimezone]);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
    }

    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.contact.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Website validation - only validate if not empty
    if (formData.contact.website?.trim()) {
      try {
        new URL(formData.contact.website);
      } catch {
        newErrors.website = 'Please enter a valid URL (starting with http:// or https://)';
      }
    }

    // Grades validation
    if (!formData.settings?.grades || formData.settings.grades.length === 0) {
      newErrors.grades = 'At least one grade must be selected';
    }

    // Sections validation
    if (!formData.settings?.sections || formData.settings.sections.length === 0) {
      newErrors.sections = 'At least one section must be selected';
    }

    if (!school && formData.adminDetails) {
      if (!formData.adminDetails.firstName.trim()) {
        newErrors.adminFirstName = 'Admin first name is required';
      }
      if (!formData.adminDetails.lastName.trim()) {
        newErrors.adminLastName = 'Admin last name is required';
      }
      if (!formData.adminDetails.email.trim()) {
        newErrors.adminEmail = 'Admin email is required';
      }
      if (!formData.adminDetails.username.trim()) {
        newErrors.adminUsername = 'Admin username is required';
      }
      if (!formData.adminDetails.password.trim()) {
        newErrors.adminPassword = 'Admin password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Clean up form data before sending
      const cleanedFormData = {
        ...formData,
        // Remove empty website to avoid URL validation error
        contact: {
          ...formData.contact,
          website: formData.contact.website?.trim() || undefined
        }
      };

      if (cleanedFormData.settings) {
        cleanedFormData.settings = {
          ...cleanedFormData.settings,
          timezone: globalTimezone,
        };
      }


      if (school?.id) {
        // Update existing school
        const response = await apiService.superadmin.updateSchool(school.id, cleanedFormData);
        if (response.data.success) {
          // Only call onSave after successful API response
          onSave(response.data.data);
          onClose();
        } else {
          throw new Error(response.data.message || 'Failed to update school');
        }
      } else {
        // Create new school
        const response = await apiService.superadmin.createSchool(cleanedFormData);
        if (response.data.success) {
          // Only call onSave after successful API response
          onSave(response.data.data);
          onClose();
        } else {
          throw new Error(response.data.message || 'Failed to create school');
        }
      }
    } catch (error: any) {
      console.error('Failed to save school:', error);
      console.error('Error response data:', error.response?.data);

      // Extract detailed validation errors
      let errorMessage = 'Failed to save school. Please check the following errors:';
      const validationErrors: Record<string, string> = {};

      if (error.response?.data?.errorSources) {
        error.response.data.errorSources.forEach((err: any) => {
          const path = Array.isArray(err.path) ? err.path.join('.') : err.path;
          validationErrors[path] = err.message;
        });

        // Create a readable error message
        const errorList = Object.entries(validationErrors).map(([path, msg]) => `${path}: ${msg}`).join('\n');
        errorMessage = `Validation errors:\n${errorList}`;
      } else {
        errorMessage = error.response?.data?.message || 'Failed to save school. Please try again.';
      }

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {school ? 'Edit School' : 'Create New School'}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
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
                    School Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter school name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
                  <select aria-label='Affiliation'
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

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <Input
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                  placeholder="Enter street address"
                  className={errors.street ? 'border-red-500' : ''}
                />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <Input
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                    placeholder="City"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <Input
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                    placeholder="State"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <Input
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange('address', 'postalCode', e.target.value)}
                    placeholder="Postal Code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Input
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={formData.contact.phone}
                    onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                    placeholder="+1-555-0123 (optional)"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
                    placeholder="admin@school.edu"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (Optional)
                </label>
                <Input
                  value={formData.contact.website}
                  onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
                  placeholder="https://school.edu (optional)"
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                <p className="text-xs text-gray-500 mt-1">Enter a valid URL or leave blank</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Academic Settings
              </CardTitle>
              <CardDescription>
                Configure the grades and sections offered by this school
                <span className="block text-xs text-gray-500 mt-1">
                  Active timezone (system-wide): {globalTimezone}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grade Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Grades Offered *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((grade) => (
                    <label key={grade} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings?.grades?.includes(grade) || false}
                        onChange={(e) => {
                          const currentGrades = formData.settings?.grades || [];
                          const newGrades = e.target.checked
                            ? [...currentGrades, grade].sort((a: number, b: number) => a - b)
                            : currentGrades.filter((g: number) => g !== grade);

                          setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              grades: newGrades
                            }
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Grade {grade}</span>
                    </label>
                  ))}
                </div>
                {errors.grades && <p className="text-red-500 text-xs mt-2">{errors.grades}</p>}
              </div>

              {/* Section Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Sections
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((section) => (
                    <label key={section} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings?.sections?.includes(section) || false}
                        onChange={(e) => {
                          const currentSections = formData.settings?.sections || [];
                          const newSections = e.target.checked
                            ? [...currentSections, section].sort()
                            : currentSections.filter((s: string) => s !== section);

                          setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              sections: newSections
                            }
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Section {section}</span>
                    </label>
                  ))}
                </div>
                {errors.sections && <p className="text-red-500 text-xs mt-2">{errors.sections}</p>}
              </div>

              {/* Max Students Per Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Students Per Section
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.settings?.maxStudentsPerSection || 0}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      maxStudentsPerSection: parseInt(e.target.value) || 0
                    }
                  }))}
                  placeholder="0"
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Default capacity for all sections</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Details (only for new schools) */}
          {!school && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Administrator Details
                </CardTitle>
                <CardDescription>
                  Create an admin account for this school
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <Input
                      value={formData.adminDetails?.firstName || ''}
                      onChange={(e) => handleInputChange('adminDetails', 'firstName', e.target.value)}
                      placeholder="First name"
                      className={errors.adminFirstName ? 'border-red-500' : ''}
                    />
                    {errors.adminFirstName && <p className="text-red-500 text-xs mt-1">{errors.adminFirstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <Input
                      value={formData.adminDetails?.lastName || ''}
                      onChange={(e) => handleInputChange('adminDetails', 'lastName', e.target.value)}
                      placeholder="Last name"
                      className={errors.adminLastName ? 'border-red-500' : ''}
                    />
                    {errors.adminLastName && <p className="text-red-500 text-xs mt-1">{errors.adminLastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.adminDetails?.email || ''}
                      onChange={(e) => handleInputChange('adminDetails', 'email', e.target.value)}
                      placeholder="admin@school.edu"
                      className={errors.adminEmail ? 'border-red-500' : ''}
                    />
                    {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      type="number"
                      value={formData.adminDetails?.phone || ''}
                      onChange={(e) => handleInputChange('adminDetails', 'phone', e.target.value)}
                      placeholder="+1-555-0124"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <Input
                      value={formData.adminDetails?.username || ''}
                      onChange={(e) => handleInputChange('adminDetails', 'username', e.target.value)}
                      placeholder="admin_username"
                      className={errors.adminUsername ? 'border-red-500' : ''}
                    />
                    {errors.adminUsername && <p className="text-red-500 text-xs mt-1">{errors.adminUsername}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <Input
                      type="password"
                      value={formData.adminDetails?.password || ''}
                      onChange={(e) => handleInputChange('adminDetails', 'password', e.target.value)}
                      placeholder="Secure password"
                      className={errors.adminPassword ? 'border-red-500' : ''}
                    />
                    {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            {errors.submit && (
              <div className="text-red-500 text-sm w-full sm:mr-auto sm:max-w-md order-1 sm:order-none">
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <pre className="whitespace-pre-wrap text-xs">{errors.submit}</pre>
                </div>
              </div>
            )}
            <div className="flex space-x-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Saving...' : (school ? 'Update School' : 'Create School')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolForm;
