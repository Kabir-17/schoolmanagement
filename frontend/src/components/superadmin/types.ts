// Shared types for Superadmin components

export interface SuperadminStats {
  totalSchools?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalParents?: number;
  activeSchools?: number;
  pendingSchools?: number;
  suspendedSchools?: number;
  activeUsers?: number;
}

export interface SuperadminUser {
  username?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface SchoolSummary {
  id?: string;
  name?: string;
  address?:
    | string
    | {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
      };
  createdAt?: string;
  updatedAt?: string;
  status?: "active" | "inactive" | "suspended" | "pending_approval";
  [key: string]: any;
}

export interface SuperadminHomeProps {
  stats: SuperadminStats | null;
  schools: SchoolSummary[];
  loading: boolean;
  user: SuperadminUser | null;
}

export interface SchoolManagementProps {
  schools: SchoolSummary[];
  onUpdate: () => void;
}

// System health metrics
export interface SystemHealth {
  serverStatus: "online" | "offline" | "maintenance";
  databaseStatus: "connected" | "disconnected" | "error";
  apiResponseTime: number;
  memoryUsage: number;
  activeConnections: number;
}

// Dashboard data response type
export interface DashboardData {
  stats: SuperadminStats;
  schools: SchoolSummary[];
  systemHealth?: SystemHealth;
}
