import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { teacherApi } from '../../services/teacher.api';
import { subjectApi } from '../../services/subject.api';
import { toast } from 'sonner';
import { Plus, Upload, X, Calendar, Clock, BookOpen, Users, AlertCircle, CheckCircle, Eye, EyeOff, FileText, Image } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  grades: number[];
  isCore: boolean;
}

interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  grade: number;
  section?: string;
  homeworkType: string;
  priority: string;
  assignedDate: string;
  dueDate: string;
  estimatedDuration: number;
  totalMarks: number;
  passingMarks: number;
  attachments?: string[];
  submissionType: string;
  allowLateSubmission: boolean;
  latePenalty?: number;
  maxLateDays?: number;
  isGroupWork: boolean;
  maxGroupSize?: number;
  isPublished: boolean;
  isOverdue?: boolean;
  isDueToday?: boolean;
  isDueTomorrow?: boolean;
  daysUntilDue?: number;
  canSubmit?: boolean;
  submissionStats?: {
    totalStudents: number;
    submittedCount: number;
    pendingCount: number;
    lateCount: number;
    submissionPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TeacherHomeworkViewProps {
  className?: string;
}

const TeacherHomeworkView: React.FC<TeacherHomeworkViewProps> = ({ className = '' }) => {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [editingHomework, setEditingHomework] = useState<HomeworkAssignment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    subjectId: '',
    grade: '',
    section: '',
    homeworkType: 'assignment',
    priority: 'medium',
    dueDate: '',
    estimatedDuration: '60',
    totalMarks: '100',
    passingMarks: '40',
    submissionType: 'both',
    allowLateSubmission: true,
    latePenalty: '10',
    maxLateDays: '3',
    isGroupWork: false,
    maxGroupSize: '4',
    isPublished: false
  });

  useEffect(() => {
    loadHomeworkAssignments();
    loadSubjects();
  }, []);

  const loadHomeworkAssignments = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getMyHomeworkAssignments();
      if (response.data.success) {
        const homeworkData = response.data.data || [];
        setAssignments(homeworkData);
        
        // Calculate statistics dynamically
        const stats = {
          total: homeworkData.length,
          published: homeworkData.filter((h: any) => h.isPublished).length,
          drafts: homeworkData.filter((h: any) => !h.isPublished).length,
          dueToday: homeworkData.filter((h: any) => h.isDueToday).length,
          overdue: homeworkData.filter((h: any) => h.isOverdue).length,
        };
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Failed to load homework assignments:', error);
      toast.error('Failed to load homework assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectApi.getAll({ isActive: true });
      if (response.data.success) {
        setSubjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast.error('You can only upload up to 5 files');
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      // If grade changes, clear subject selection to show only relevant subjects
      if (name === 'grade') {
        setFormData(prev => ({ ...prev, [name]: value, subjectId: '' }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formPayload = new FormData();
    
    // Add individual fields to FormData with correct types
    formPayload.append('title', formData.title);
    formPayload.append('description', formData.description);
    formPayload.append('instructions', formData.instructions || '');
    formPayload.append('subjectId', formData.subjectId);
    formPayload.append('grade', formData.grade);
    formPayload.append('section', formData.section || '');
    formPayload.append('homeworkType', formData.homeworkType);
    formPayload.append('priority', formData.priority);
    formPayload.append('assignedDate', new Date().toISOString());
    formPayload.append('dueDate', new Date(formData.dueDate).toISOString());
    formPayload.append('estimatedDuration', formData.estimatedDuration);
    formPayload.append('totalMarks', formData.totalMarks);
    formPayload.append('passingMarks', formData.passingMarks);
    formPayload.append('submissionType', formData.submissionType);
    formPayload.append('allowLateSubmission', formData.allowLateSubmission.toString());
    formPayload.append('latePenalty', formData.allowLateSubmission ? formData.latePenalty : '0');
    formPayload.append('maxLateDays', formData.allowLateSubmission ? formData.maxLateDays : '0');
    formPayload.append('isGroupWork', formData.isGroupWork.toString());
    if (formData.isGroupWork) {
      formPayload.append('maxGroupSize', formData.maxGroupSize);
    }
    formPayload.append('isPublished', formData.isPublished.toString());

    // Add files
    selectedFiles.forEach(file => {
      formPayload.append('attachments', file);
    });

    try {
      let response;
      if (editingHomework) {
        response = await teacherApi.updateHomework(editingHomework.id, formPayload);
        toast.success('Homework updated successfully!');
      } else {
        response = await teacherApi.assignHomework(formPayload);
        toast.success('Homework assigned successfully!');
      }
      
      if (response.data.success) {
        resetForm();
        loadHomeworkAssignments();
      }
    } catch (error) {
      console.error('Failed to save homework:', error);
      toast.error('Failed to save homework. Please try again.');
    }
  };

  const handleSaveAsDraft = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in title and description');
      return;
    }

    const formPayload = new FormData();
    
    // Add individual fields to FormData for draft
    formPayload.append('title', formData.title);
    formPayload.append('description', formData.description);
    formPayload.append('instructions', formData.instructions || '');
    if (formData.subjectId) {
      formPayload.append('subjectId', formData.subjectId);
    }
    if (formData.grade) {
      formPayload.append('grade', formData.grade);
    }
    formPayload.append('section', formData.section || '');
    formPayload.append('homeworkType', formData.homeworkType);
    formPayload.append('priority', formData.priority);
    formPayload.append('assignedDate', new Date().toISOString());
    if (formData.dueDate) {
      formPayload.append('dueDate', new Date(formData.dueDate).toISOString());
    }
    formPayload.append('estimatedDuration', formData.estimatedDuration || '60');
    formPayload.append('totalMarks', formData.totalMarks || '100');
    formPayload.append('passingMarks', formData.passingMarks || '40');
    formPayload.append('submissionType', formData.submissionType);
    formPayload.append('allowLateSubmission', formData.allowLateSubmission.toString());
    formPayload.append('latePenalty', formData.allowLateSubmission ? formData.latePenalty : '0');
    formPayload.append('maxLateDays', formData.allowLateSubmission ? formData.maxLateDays : '0');
    formPayload.append('isGroupWork', formData.isGroupWork.toString());
    if (formData.isGroupWork) {
      formPayload.append('maxGroupSize', formData.maxGroupSize);
    }
    formPayload.append('isPublished', 'false'); // Always false for drafts

    selectedFiles.forEach(file => {
      formPayload.append('attachments', file);
    });

    try {
      let response;
      if (editingHomework) {
        response = await teacherApi.updateHomework(editingHomework.id, formPayload);
        toast.success('Draft updated successfully!');
      } else {
        response = await teacherApi.assignHomework(formPayload);
        toast.success('Draft saved successfully!');
      }
      
      if (response.data.success) {
        resetForm();
        loadHomeworkAssignments();
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft. Please try again.');
    }
  };

  const handleEditHomework = (homework: HomeworkAssignment) => {
    setEditingHomework(homework);
    setFormData({
      title: homework.title,
      description: homework.description,
      instructions: homework.instructions || '',
      subjectId: homework.subject?.id || '',
      grade: homework.grade.toString(),
      section: homework.section || '',
      homeworkType: homework.homeworkType,
      priority: homework.priority,
      dueDate: new Date(homework.dueDate).toISOString().slice(0, 16),
      estimatedDuration: homework.estimatedDuration.toString(),
      totalMarks: homework.totalMarks.toString(),
      passingMarks: homework.passingMarks.toString(),
      submissionType: homework.submissionType,
      allowLateSubmission: homework.allowLateSubmission,
      latePenalty: homework.latePenalty?.toString() || '10',
      maxLateDays: homework.maxLateDays?.toString() || '3',
      isGroupWork: homework.isGroupWork,
      maxGroupSize: homework.maxGroupSize?.toString() || '4',
      isPublished: homework.isPublished
    });
    setShowAssignForm(true);
  };

  const handlePublishHomework = async (homeworkId: string) => {
    try {
      await teacherApi.publishHomework(homeworkId);
      toast.success('Homework published successfully!');
      loadHomeworkAssignments();
    } catch (error) {
      console.error('Failed to publish homework:', error);
      toast.error('Failed to publish homework. Please try again.');
    }
  };

  const resetForm = () => {
    setShowAssignForm(false);
    setEditingHomework(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      subjectId: '',
      grade: '',
      section: '',
      homeworkType: 'assignment',
      priority: 'medium',
      dueDate: '',
      estimatedDuration: '60',
      totalMarks: '100',
      passingMarks: '40',
      submissionType: 'both',
      allowLateSubmission: true,
      latePenalty: '10',
      maxLateDays: '3',
      isGroupWork: false,
      maxGroupSize: '4',
      isPublished: false
    });
    setSelectedFiles([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (assignment: HomeworkAssignment) => {
    if (assignment.isOverdue) return 'text-red-600 bg-red-50';
    if (assignment.isDueToday) return 'text-orange-600 bg-orange-50';
    if (assignment.isDueTomorrow) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Assignments</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.total || 0}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published</p>
              <p className="text-2xl font-bold text-green-600">{statistics.published || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Drafts</p>
              <p className="text-2xl font-bold text-gray-600">{statistics.drafts || 0}</p>
            </div>
            <EyeOff className="h-8 w-8 text-gray-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Due Today</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.dueToday || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{statistics.overdue || 0}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Homework Assignments</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading assignments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Homework Assignments</h2>
          <p className="text-gray-600">Manage and track homework assignments for your classes</p>
        </div>
        <Button
          onClick={() => setShowAssignForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Assign Homework
        </Button>
      </div>

      {/* Statistics */}
      {renderStatistics()}

      {/* Assignment Form Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {editingHomework ? 'Edit Homework Assignment' : 'Assign New Homework'}
                </h3>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <Input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter homework title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the homework assignment"
                      required
                    />
                  </div>

                  {/* Instructions */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions (Optional)
                    </label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional instructions for students"
                    />
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade *
                    </label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Grade</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                        <option key={grade} value={grade}>Grade {grade}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section (Optional)
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Sections</option>
                      {['A', 'B', 'C', 'D', 'E'].map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      name="subjectId"
                      value={formData.subjectId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.length === 0 ? (
                        <option value="" disabled>No subjects available</option>
                      ) : (
                        subjects
                          .filter(subject => 
                            !formData.grade || 
                            subject.grades.includes(parseInt(formData.grade))
                          )
                          .map(subject => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </option>
                          ))
                      )}
                    </select>
                    {formData.grade && subjects.filter(subject => 
                      subject.grades.includes(parseInt(formData.grade))
                    ).length === 0 && (
                      <p className="text-sm text-yellow-600 mt-1">
                        No subjects available for Grade {formData.grade}
                      </p>
                    )}
                  </div>

                  {/* Homework Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      name="homeworkType"
                      value={formData.homeworkType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="project">Project</option>
                      <option value="reading">Reading</option>
                      <option value="practice">Practice</option>
                      <option value="research">Research</option>
                      <option value="presentation">Presentation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <Input
                      type="datetime-local"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Estimated Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration (minutes)
                    </label>
                    <Input
                      type="number"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleInputChange}
                      min="15"
                      max="1440"
                    />
                  </div>

                  {/* Total Marks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks
                    </label>
                    <Input
                      type="number"
                      name="totalMarks"
                      value={formData.totalMarks}
                      onChange={handleInputChange}
                      min="1"
                      max="1000"
                    />
                  </div>

                  {/* Passing Marks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Marks
                    </label>
                    <Input
                      type="number"
                      name="passingMarks"
                      value={formData.passingMarks}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  {/* Submission Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Submission Type
                    </label>
                    <select
                      name="submissionType"
                      value={formData.submissionType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text Only</option>
                      <option value="file">File Only</option>
                      <option value="both">Text & File</option>
                      <option value="none">No Submission</option>
                    </select>
                  </div>

                  {/* Late Submission */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowLateSubmission"
                        checked={formData.allowLateSubmission}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Allow Late Submission
                    </label>
                  </div>

                  {/* Late Penalty */}
                  {formData.allowLateSubmission && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Late Penalty (% per day)
                        </label>
                        <Input
                          type="number"
                          name="latePenalty"
                          value={formData.latePenalty}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Late Days
                        </label>
                        <Input
                          type="number"
                          name="maxLateDays"
                          value={formData.maxLateDays}
                          onChange={handleInputChange}
                          min="1"
                          max="30"
                        />
                      </div>
                    </>
                  )}

                  {/* Group Work */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isGroupWork"
                        checked={formData.isGroupWork}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Group Work
                    </label>
                  </div>

                  {/* Max Group Size */}
                  {formData.isGroupWork && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Group Size
                      </label>
                      <Input
                        type="number"
                        name="maxGroupSize"
                        value={formData.maxGroupSize}
                        onChange={handleInputChange}
                        min="2"
                        max="10"
                      />
                    </div>
                  )}

                  {/* Publish Status */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Publish Immediately
                    </label>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (Optional - Max 5 files)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload files or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          Images, PDF, DOC, DOCX, TXT (Max 10MB each)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            {file.type.startsWith('image/') ? (
                              <Image className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeFile(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveAsDraft}
                    className="flex items-center gap-2"
                  >
                    <EyeOff className="h-4 w-4" />
                    Save as Draft
                  </Button>
                  <Button 
                    type="submit"
                    className="flex items-center gap-2"
                    onClick={() => setFormData(prev => ({ ...prev, isPublished: true }))}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {editingHomework ? 'Update & Publish' : 'Assign & Publish'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Homework Assignments</h3>
            <p className="text-gray-500 mb-4">
              You haven't assigned any homework yet. Click "Assign Homework" to get started.
            </p>
            <Button onClick={() => setShowAssignForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Your First Homework
            </Button>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(assignment.priority)}`}>
                      {assignment.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment)}`}>
                      {assignment.isOverdue ? 'Overdue' : 
                       assignment.isDueToday ? 'Due Today' : 
                       assignment.isDueTomorrow ? 'Due Tomorrow' : 
                       'Active'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{assignment.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Grade {assignment.grade}{assignment.section ? ` - Section ${assignment.section}` : ' (All Sections)'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {formatDate(assignment.dueDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {assignment.estimatedDuration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {assignment.totalMarks} marks
                    </div>
                  </div>

                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">Attachments ({assignment.attachments.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <FileText className="h-3 w-3" />
                            Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {assignment.isPublished ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-xs ${assignment.isPublished ? 'text-green-600' : 'text-gray-500'}`}>
                        {assignment.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Statistics */}
              {assignment.submissionStats && assignment.isPublished && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {assignment.submissionStats.totalStudents}
                      </div>
                      <div className="text-xs text-gray-500">Total Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {assignment.submissionStats.submittedCount}
                      </div>
                      <div className="text-xs text-gray-500">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">
                        {assignment.submissionStats.pendingCount}
                      </div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {assignment.submissionStats.submissionPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Completion</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Created: {formatDate(assignment.createdAt)}
                  {assignment.createdAt !== assignment.updatedAt && (
                    <> • Updated: {formatDate(assignment.updatedAt)}</>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View Submissions
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditHomework(assignment)}
                    className="flex items-center gap-1"
                  >
                    Edit
                  </Button>
                  {!assignment.isPublished && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePublishHomework(assignment.id)}
                      className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherHomeworkView;