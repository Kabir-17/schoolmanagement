import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  BookOpen,
  Plus,
  Calendar,
  Users,
  Paperclip,
  Send,
  Edit,
  Trash2,
  Eye,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { teacherApi } from "../../services/teacher.api";

interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  grade: string;
  section: string;
  subject: string;
  dueDate: string;
  createdAt: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
  }>;
  submissionCount?: number;
  totalStudents?: number;
}

interface TeacherClass {
  grade: number;
  section: string;
  className: string;
  subjects: string[];
  totalPeriods: number;
  daysScheduled: string[];
  studentsCount: number;
  classId?: string;
}

const TeacherHomeworkManagement: React.FC = () => {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade: '',
    section: '',
    subject: '',
    dueDate: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    loadHomeworkAssignments();
    loadTeacherClasses();
  }, []);

  const loadHomeworkAssignments = async () => {
    try {
      setLoading(true);
      const response = await teacherApi.getTeacherHomeworkAssignments();
      if (response.data.success) {
        setAssignments(response.data.data.assignments || []);
      }
    } catch (error: any) {
      console.error("Failed to load homework assignments:", error);
      toast.error(error.response?.data?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherClasses = async () => {
    try {
      const response = await teacherApi.getTeacherClasses();
      if (response.data.success) {
        setTeacherClasses(response.data.data.classes || []);
      }
    } catch (error: any) {
      console.error("Failed to load teacher classes:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.dueDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const homeworkData = {
        ...formData,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const response = await teacherApi.assignNewHomework(homeworkData);

      if (response.data.success) {
        toast.success("Homework assigned successfully!");
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          grade: '',
          section: '',
          subject: '',
          dueDate: '',
        });
        setAttachments([]);
        loadHomeworkAssignments();
      }
    } catch (error: any) {
      console.error("Failed to assign homework:", error);
      toast.error(error.response?.data?.message || "Failed to assign homework");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (dueDate: string) => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    if (daysUntilDue < 0) return "text-red-600 bg-red-50";
    if (daysUntilDue <= 2) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assign New Homework</h2>
            <p className="text-gray-600">Create a homework assignment for your students</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(false)}
            variant="outline"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter homework title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    {Array.from(new Set(teacherClasses.map(c => c.grade))).map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section *
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Section</option>
                    {formData.grade &&
                      Array.from(new Set(
                        teacherClasses
                          .filter(c => c.grade.toString() === formData.grade)
                          .map(c => c.section)
                      )).map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {formData.grade && formData.section &&
                      Array.from(new Set(
                        teacherClasses
                          .filter(c => c.grade.toString() === formData.grade && c.section === formData.section)
                          .flatMap(c => c.subjects)
                      )).map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter detailed instructions for the homework"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Assign Homework
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Homework Management</h2>
          <p className="text-gray-600">Manage homework assignments for your classes</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign New Homework
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Due This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => getDaysUntilDue(a.dueDate) <= 7 && getDaysUntilDue(a.dueDate) >= 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => getDaysUntilDue(a.dueDate) < 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading assignments...</p>
            </div>
          </CardContent>
        </Card>
      ) : assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.dueDate)}`}>
                        {getDaysUntilDue(assignment.dueDate) < 0 
                          ? "Overdue"
                          : getDaysUntilDue(assignment.dueDate) === 0
                          ? "Due Today"
                          : `${getDaysUntilDue(assignment.dueDate)} days left`
                        }
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Grade {assignment.grade} - Section {assignment.section}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {assignment.subject}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {formatDate(assignment.dueDate)}
                      </div>
                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 mr-1" />
                          {assignment.attachments.length} file(s)
                        </div>
                      )}
                    </div>

                    {assignment.submissionCount !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Submissions</span>
                          <span className="font-medium">
                            {assignment.submissionCount} / {assignment.totalStudents}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(assignment.submissionCount / (assignment.totalStudents || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Homework Assignments</h3>
              <p className="text-gray-600">
                You haven't assigned any homework yet. Click the button above to create your first assignment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherHomeworkManagement;