import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Search,
  Calendar,
  User,
  AlertOctagon,
  FileText,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../services/admin.api";

interface DisciplinaryAction {
  id: string;
  studentName: string;
  studentRoll: string;
  grade: string;
  section: string;
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

const AdminDisciplinaryActionsManager: React.FC = () => {
  const [actions, setActions] = useState<DisciplinaryAction[]>([]);
  const [stats, setStats] = useState<DisciplinaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<DisciplinaryAction | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [comment, setComment] = useState('');
  const [filters, setFilters] = useState({
    actionType: '',
    severity: '',
    status: '',
    search: '',
  });

  const loadDisciplinaryActions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDisciplinaryActions({
        actionType: filters.actionType || undefined,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setActions(data.actions || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to load disciplinary actions:', error);
      toast.error('Failed to load disciplinary actions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDisciplinaryActions();
  }, [loadDisciplinaryActions]);

  const handleResolve = async () => {
    if (!selectedAction || !resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }

    try {
      const response = await adminApi.resolveDisciplinaryAction(selectedAction.id, {
        resolutionNotes: resolutionNotes.trim()
      });

      if (response.data.success) {
        toast.success('Disciplinary action resolved successfully');
        setShowResolveModal(false);
        setResolutionNotes('');
        setSelectedAction(null);
        loadDisciplinaryActions();
      }
    } catch (error) {
      console.error('Failed to resolve disciplinary action:', error);
      toast.error('Failed to resolve disciplinary action');
    }
  };

  const handleAddComment = async () => {
    if (!selectedAction || !comment.trim()) {
      toast.error('Please provide a comment');
      return;
    }

    try {
      const response = await adminApi.addDisciplinaryActionComment(selectedAction.id, {
        comment: comment.trim()
      });

      if (response.data.success) {
        toast.success('Comment added successfully');
        setShowCommentModal(false);
        setComment('');
        setSelectedAction(null);
        loadDisciplinaryActions();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

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

  const getActionIcon = (actionType: string, isRedWarrant: boolean) => {
    if (isRedWarrant) return <AlertOctagon className="h-4 w-4" />;
    switch (actionType) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'punishment': return <Shield className="h-4 w-4" />;
      case 'detention': return <Clock className="h-4 w-4" />;
      case 'suspension': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredActions = actions.filter(action =>
    action.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
    action.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    action.studentRoll.toLowerCase().includes(filters.search.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold text-gray-900">School Disciplinary Actions</h2>
          <p className="text-gray-600">Monitor and manage all disciplinary actions across the school</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Actions</p>
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <AlertOctagon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Red Warrants</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.redWarrants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search actions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            
            <select
              value={filters.actionType}
              onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="warning">Warning</option>
              <option value="punishment">Punishment</option>
              <option value="detention">Detention</option>
              <option value="suspension">Suspension</option>
              <option value="red_warrant">Red Warrant</option>
            </select>
            
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="appealed">Appealed</option>
            </select>
            
            <Button
              onClick={() => setFilters({ actionType: '', severity: '', status: '', search: '' })}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.map((action) => (
          <Card key={action.id} className={`${action.isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.isRedWarrant ? 'bg-red-100' : 'bg-gray-100'}`}>
                        {getActionIcon(action.actionType, action.isRedWarrant)}
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
                          {action.isRedWarrant && (
                            <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-medium">
                              RED WARRANT
                            </span>
                          )}
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
                      <span className="font-medium">{action.studentName}</span>
                      <span className="text-gray-500">({action.studentRoll})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(action.issuedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-600">
                      Grade {action.grade}-{action.section}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-gray-700">{action.description}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium">Reason:</span> {action.reason}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${action.parentNotified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
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
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 min-w-[120px]">
                  {action.status === 'active' && (
                    <Button
                      onClick={() => {
                        setSelectedAction(action);
                        setShowResolveModal(true);
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      setSelectedAction(action);
                      setShowCommentModal(true);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No disciplinary actions found</h3>
            <p className="text-gray-600">There are no disciplinary actions matching your current filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resolve Disciplinary Action</h3>
              <p className="text-gray-600 mb-4">
                You are about to resolve the action: <strong>{selectedAction.title}</strong> for <strong>{selectedAction.studentName}</strong>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes *
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Explain how this issue was resolved and what measures were taken..."
                    required
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowResolveModal(false);
                  setResolutionNotes('');
                  setSelectedAction(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                className="bg-green-600 hover:bg-green-700"
                disabled={!resolutionNotes.trim()}
              >
                Resolve Action
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
              <p className="text-gray-600 mb-4">
                Add a follow-up comment for: <strong>{selectedAction.title}</strong> for <strong>{selectedAction.studentName}</strong>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment *
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add follow-up notes, observations, or additional actions taken..."
                    required
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                  setSelectedAction(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisciplinaryActionsManager;