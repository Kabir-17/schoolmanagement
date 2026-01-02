import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  AlertOctagon,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { parentApi } from "../../services/parent.api";

interface DisciplinaryAction {
  id: string;
  studentName: string;
  studentRoll: string;
  grade: string;
  section: string;
  teacherName: string;
  actionType: 'warning' | 'punishment' | 'suspension' | 'detention' | 'red_warrant';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'behavior' | 'attendance' | 'academic' | 'discipline' | 'uniform' | 'other';
  title: string;
  description: string;
  reason: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'appealed';
  issuedDate: string;
  isRedWarrant: boolean;
  warrantLevel?: 'yellow' | 'orange' | 'red';
  parentNotified: boolean;
  studentAcknowledged: boolean;
  followUpRequired: boolean;
  followUpDate?: string;
  resolutionNotes?: string;
  canAppeal: boolean;
  isOverdue: boolean;
}

interface DisciplinaryStats {
  totalActions: number;
  activeActions: number;
  resolvedActions: number;
  pendingAcknowledgment: number;
  overdueFollowUps: number;
  redWarrants: number;
}

const ParentDisciplinaryActions: React.FC = () => {
  const [actions, setActions] = useState<DisciplinaryAction[]>([]);
  const [stats, setStats] = useState<DisciplinaryStats | null>(null);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDisciplinaryActions = async () => {
      try {
        setLoading(true);
        const response = await parentApi.getChildDisciplinaryActions();
        
        if (response.data.success) {
          const data = response.data.data;
          setActions(data.actions || []);
          setStats(data.stats || null);
          setChildrenCount(data.childrenCount || 0);
        }
      } catch (error) {
        console.error('Failed to load child red warrants:', error);
        toast.error('Failed to load child red warrants');
      } finally {
        setLoading(false);
      }
    };

    loadDisciplinaryActions();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'appealed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Child Red Warrants</h2>
          <p className="text-gray-600">
            Monitor your {childrenCount === 1 ? 'child\'s' : 'children\'s'} red warrants and their status
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Red Warrants</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-red-600">{stats.activeActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolvedActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Acknowledgment</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingAcknowledgment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-4">
        {actions.map((action) => (
          <Card key={action.id} className={`${action.isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <AlertOctagon className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(action.severity)}`}>
                          {action.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                          {action.status.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-medium">
                          RED WARRANT
                        </span>
                        {action.isOverdue && (
                          <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Student:</span>
                    <span className="text-gray-600">{action.studentName} ({action.studentRoll})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Teacher:</span>
                    <span className="text-gray-600">{action.teacherName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Date:</span>
                    <span className="text-gray-600">{new Date(action.issuedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-700">{action.description}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {action.reason}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Category:</span> {action.category}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Grade:</span> {action.grade}-{action.section}
                  </p>
                </div>

                {action.resolutionNotes && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Resolution Notes:</h4>
                    <p className="text-sm text-green-700 whitespace-pre-wrap">{action.resolutionNotes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${action.parentNotified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Parent {action.parentNotified ? 'Notified' : 'Not Notified'}
                  </span>
                  <span className={`px-2 py-1 rounded ${action.studentAcknowledged ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    Student {action.studentAcknowledged ? 'Acknowledged' : 'Not Acknowledged'}
                  </span>
                  {action.followUpRequired && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      Follow-up Required
                    </span>
                  )}
                  {action.canAppeal && action.status === 'active' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      Can Appeal
                    </span>
                  )}
                </div>

                {action.followUpDate && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Follow-up Date:</span> {new Date(action.followUpDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {actions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No red warrants</h3>
            <p className="text-gray-600">
              Your {childrenCount === 1 ? 'child has' : 'children have'} no red warrants! They are maintaining good behavior.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParentDisciplinaryActions;