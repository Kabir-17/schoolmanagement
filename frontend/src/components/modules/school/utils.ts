import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export const getStatusConfig = (status: string) => {
  const statusConfig = {
    active: {
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
      text: "Active",
    },
    inactive: {
      color: "bg-gray-100 text-gray-800",
      icon: XCircle,
      text: "Inactive",
    },
    suspended: {
      color: "bg-red-100 text-red-800",
      icon: AlertTriangle,
      text: "Suspended",
    },
    pending_approval: {
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      text: "Pending Approval",
    },
  };

  return (
    statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
  );
};

export const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};
