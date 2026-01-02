export interface School {
  id: string;
  name: string;
  slug: string;
  schoolId: string;
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
  status: "active" | "inactive" | "suspended" | "pending_approval";
  affiliation?: string;
  recognition?: string;
  currentSession?: {
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  settings?: {
    maxStudentsPerSection: number;
    grades: number[];
    sections: string[];
    timezone: string;
    language: string;
    currency: string;
  };
  stats?: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalClasses: number;
    totalSubjects: number;
    attendanceRate: number;
    lastUpdated: string;
  };
  admin?: {
    id: string;
    username: string;
    password?: string; // For superadmin view only
    fullName: string;
    email: string;
    phone: string;
    lastLogin?: string;
  };
  apiEndpoint?: string;
  apiKey?: string; // For superadmin view only
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolDetailsProps {
  schoolId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (school: School) => void;
}
