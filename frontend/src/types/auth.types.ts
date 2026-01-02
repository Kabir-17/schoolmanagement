export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'parent' | 'accountant';
  schoolId?: string;
  isActive: boolean;
  isFirstLogin?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
  requiresPasswordChange?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface PasswordChangeCredentials {
  newPassword: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  login: (credentials: LoginCredentials) => Promise<{success: boolean; requiresPasswordChange?: boolean}>;
  logout: () => Promise<void>;
  changePassword: (credentials: PasswordChangeCredentials) => Promise<boolean>;
  isAuthenticated: boolean;
}