import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { apiService } from "@/services";

interface StudentProfileData {
  id: string;
  studentId: string;
  grade: number;
  section: string;
  rollNumber: number;
  bloodGroup?: string;
  dob?: string;
  admissionDate?: string;
  isActive: boolean;
  age?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  school?: {
    id: string;
    name: string;
    schoolId?: string;
    establishedYear?: number;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    affiliation?: string;
    logo?: string;
  };
  parent?: {
    id: string;
    userId?: string;
    fullName: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    occupation?: string;
    relationship?: string;
  };
  photos?: Array<{
    id: string;
    photoPath: string;
    photoNumber: number;
    filename: string;
    size: number;
    createdAt: string;
  }>;
}

interface StudentProfileProps {
  studentData?: any;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ studentData }) => {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentData) {
      setProfile(studentData);
      setLoading(false);
    } else {
      loadStudentProfile();
    }
    // eslint-disable-next-line
  }, [studentData]);

  const loadStudentProfile = async () => {
    try {
      setLoading(true);
      // First get dashboard data to get student ID
      const dashboardResponse = await apiService.student.getDashboard();
      if (
        dashboardResponse.data.success &&
        dashboardResponse.data.data?.student
      ) {
        const studentInfo = dashboardResponse.data.data.student;
        // Then get full profile data
        const profileResponse = await apiService.student.getProfile(
          studentInfo.id
        );
        if (profileResponse.data.success) {
          setProfile(profileResponse.data.data);
        }
      }
    } catch (error) {
      console.error("Failed to load student profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Unable to load student profile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Information */}
      <Card>
        <p className="flex items-center gap-2 text-xl font-semibold p-5">
          <User className="w-4 h-4" />
          Student Information
        </p>
        <CardContent>
          <div className="flex gap-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile.photos && profile.photos.length > 0 ? (
                  <img
                    src={profile.photos[0].photoPath}
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  profile.isActive
                    ? "bg-gray-100 text-gray-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {profile.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Student Details */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {profile.user?.fullName ||
                    `${profile.user?.firstName || "Unknown"} ${
                      profile.user?.lastName || "Student"
                    }`}
                </h3>
                <p className="text-sm text-gray-600">
                  Student ID: {profile.studentId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span>
                      Class: {profile.grade}-{profile.section}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">#</span>
                    <span>Roll: {profile.rollNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Age: {profile.age || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🩸</span>
                    <span>Blood: {profile.bloodGroup || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {profile.admissionDate
                        ? new Date(profile.admissionDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{profile.user?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{profile.user?.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.address && (
                      <div className="">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Address</p>
                            <p className="text-gray-600">
                              {[
                                profile.address.street,
                                profile.address.city,
                                profile.address.state,
                                profile.address.country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                              {profile.address.postalCode &&
                                ` - ${profile.address.postalCode}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parent Information */}
      {profile.parent && (
        <Card>
          <p className="flex items-center gap-2 text-xl font-semibold p-5">
            <Users className="w-4 h-4" />
            Parent/Guardian Information
          </p>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.parent.fullName}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {profile.parent.relationship || "Guardian"}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{profile.parent.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{profile.parent.phone || "N/A"}</span>
                  </div>
                  {profile.parent.occupation && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">💼</span>
                      <span>{profile.parent.occupation}</span>
                    </div>
                  )}
                </div>
              </div>

              {profile.parent.address && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Address</p>
                      <p className="text-gray-600">{profile.parent.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Information */}
      {profile.school && (
        <Card>
          <p className="flex items-center gap-2 text-xl font-semibold p-5">
            <GraduationCap className="w-4 h-4" />
            School Information
          </p>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden">
                {profile.school.logo ? (
                  <img
                    src={profile.school.logo}
                    alt={`${profile.school.name} Logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {profile.school.name || "Unknown School"}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Active Institution</span>
                  </div>
                  {profile.school.establishedYear && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">•</span>
                      <span>Est. {profile.school.establishedYear}</span>
                    </div>
                  )}
                  {profile.school.affiliation && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">•</span>
                      <span>{profile.school.affiliation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* School Details Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              {profile.school.contact && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    {profile.school.contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{profile.school.contact.phone}</span>
                      </div>
                    )}
                    {profile.school.contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{profile.school.contact.email}</span>
                      </div>
                    )}
                    {profile.school.contact.website && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        <a 
                          href={profile.school.contact.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {profile.school.contact.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address Information */}
              {profile.school.address && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    School Address
                  </h4>
                  <div className="text-sm text-gray-600">
                    <div className="space-y-1">
                      {profile.school.address.street && (
                        <p>{profile.school.address.street}</p>
                      )}
                      <p>
                        {[
                          profile.school.address.city,
                          profile.school.address.state,
                          profile.school.address.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {profile.school.address.country && (
                        <p className="font-medium">{profile.school.address.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  You are enrolled at <strong>{profile.school.name}</strong> and have access to all school resources, activities, and academic programs.
                  {profile.school.affiliation && (
                    <span> This institution is affiliated with <strong>{profile.school.affiliation}</strong>.</span>
                  )}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentProfile;
