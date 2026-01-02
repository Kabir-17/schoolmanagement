export interface TeacherFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  designation: string;
  bloodGroup: string;
  dob: string;
  joinDate?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  qualifications: Array<{
    degree: string;
    institution: string;
    year: string;
    grade?: string;
  }>;
  subjects: string[];
  photo?: File | null;
  photoPreview?: string;
}

export interface Credentials {
  username: string;
  password: string;
  teacherId: string;
  employeeId: string;
}

export interface TeacherFormProps {
  onBack?: () => void;
}

export interface BasicInfoProps {
  formData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    employeeId?: string;
    designation: string;
    bloodGroup: string;
    dob: string;
    joinDate?: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export interface AddressInfoProps {
  formData: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export interface QualificationsProps {
  formData: {
    qualifications: Array<{
      degree: string;
      institution: string;
      year: string;
      grade?: string;
    }>;
    subjects: string[];
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export interface PhotoUploadProps {
  formData: {
    photo?: File | null;
    photoPreview?: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export interface CredentialsDisplayProps {
  credentials: Credentials | null;
  onClose?: () => void;
}
