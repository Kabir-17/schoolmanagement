import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../services/admin.api";
import { useAuth } from "../../context/AuthContext";

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  grades: number[];
  isCore: boolean;
  credits?: number;
  teachers: Teacher[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Teacher {
  _id: string;
  teacherId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  subjects: string[];
  designation: string;
}

const SubjectManagement: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    grades: [] as number[],
    isCore: true,
    credits: 1,
    teachers: [] as string[],
  });


  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSubjects();
      setSubjects(response.data.data || []);
    } catch (error: any) {
      console.error("❌ Error fetching subjects:", error);
      toast.error("Error fetching subjects");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await adminApi.getTeachers();
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching teachers:", error);
      toast.error("Error fetching teachers");
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSubjects();
      fetchTeachers();
      fetchSchoolData();
    }
  }, [user, fetchSubjects, fetchTeachers]);

  const fetchSchoolData = async () => {
    try {
      const response = await adminApi.getSchoolSettings();
      if (response.data.success) {
        setSchoolData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch school data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subjectData = {
        ...formData,
        schoolId: user?.schoolId,
        teachers: formData.teachers, // Send teacher IDs
      };


      if (editingSubject) {
        await adminApi.updateSubject(editingSubject._id, subjectData);
        toast.success("Subject updated successfully");
      } else {
        await adminApi.createSubject(subjectData);
        toast.success("Subject created successfully");
      }

      setIsFormOpen(false);
      setEditingSubject(null);
      resetForm();
      fetchSubjects();
      fetchTeachers(); // Refresh teachers to get updated subject assignments
    } catch (error: any) {
      console.error("❌ Subject save error:", error);
      toast.error(error.response?.data?.message || "Error saving subject");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;

    setLoading(true);
    try {
      await adminApi.deleteSubject(subjectId);
      toast.success("Subject deleted successfully");
      fetchSubjects();
      fetchTeachers(); // Refresh teachers to update their subject assignments
    } catch (error: any) {
      console.error("❌ Subject delete error:", error);
      toast.error(error.response?.data?.message || "Error deleting subject");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      grades: [],
      isCore: true,
      credits: 1,
      teachers: [],
    });
  };

  const openEditForm = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      grades: subject.grades,
      isCore: subject.isCore,
      credits: subject.credits || 1,
      teachers: subject.teachers.map(t => t._id),
    });
    setIsFormOpen(true);
  };

  const toggleGrade = (grade: number) => {
    setFormData(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade].sort((a, b) => a - b)
    }));
  };

  // const toggleTeacher = (teacherId: string) => {
  //   console.log('Toggling teacher:', teacherId);
  //   console.log('Current teachers:', formData.teachers);
    
  //   setFormData(prev => {
  //     const currentTeachers = prev.teachers || []; // Ensure it's an array
  //     const isCurrentlySelected = currentTeachers.includes(teacherId);
      
  //     const newTeachers = isCurrentlySelected
  //       ? currentTeachers.filter(id => id !== teacherId)
  //       : [...currentTeachers, teacherId];
      
  //     console.log('New teachers:', newTeachers);
      
  //     return {
  //       ...prev,
  //       teachers: newTeachers
  //     };
  //   });
  // };

  const getSubjectStats = () => {
    const total = subjects.length;
    const core = subjects.filter(s => s.isCore).length;
    const elective = total - core;
    const withTeachers = subjects.filter(s => s.teachers && s.teachers.length > 0).length;

    return { total, core, elective, withTeachers };
  };

  const stats = getSubjectStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <p className="text-gray-600">Manage subjects and assign teachers</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Core Subjects</p>
                <p className="text-2xl font-bold">{stats.core}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Electives</p>
                <p className="text-2xl font-bold">{stats.elective}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Teachers</p>
                <p className="text-2xl font-bold">{stats.withTeachers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingSubject ? "Edit Subject" : "Add New Subject"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Subject Name*
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Subject Code*
                    </label>
                    <Input
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ 
                          ...formData, 
                          code: e.target.value.toUpperCase() 
                        })
                      }
                      placeholder="e.g., MATH"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the subject"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Subject Type*
                    </label>
                    <Select
                      value={formData.isCore ? "core" : "elective"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, isCore: value === "core" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core Subject</SelectItem>
                        <SelectItem value="elective">Elective Subject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Credits
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({ 
                          ...formData, 
                          credits: parseInt(e.target.value) || 1 
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Grades* (Select applicable grades)
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {(schoolData?.settings?.grades || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((grade: number) => (
                      <label key={grade} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.grades.includes(grade)}
                          onChange={() => toggleGrade(grade)}
                          className="mr-2"
                        />
                        <span className="text-sm">Grade {grade}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium mb-2">
                    Assign Teachers (Optional)
                  </label>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {teachers.length === 0 ? (
                      <p className="text-sm text-gray-500">No teachers available</p>
                    ) : (
                      teachers.map((teacher, index) => {
                        return (
                          <label key={teacher._id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.teachers && formData.teachers.includes(teacher._id)}
                              onChange={() => toggleTeacher(teacher._id)}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {teacher.user.firstName} {teacher.user.lastName}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({teacher.designation})
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div> */}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !formData.name ||
                      !formData.code ||
                      formData.grades.length === 0
                    }
                  >
                    {loading
                      ? "Saving..."
                      : editingSubject
                      ? "Update Subject"
                      : "Create Subject"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingSubject(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle>All Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading subjects...</p>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div
                  key={subject._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {subject.name}
                      </h3>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                        {subject.code}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          subject.isCore
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {subject.isCore ? "Core" : "Elective"}
                      </span>
                    </div>
                    
                    {subject.description && (
                      <p className="text-gray-600 text-sm mb-2">
                        {subject.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        <strong>Grades:</strong> {subject.grades.join(", ")}
                      </span>
                      <span>
                        <strong>Credits:</strong> {subject.credits || 1}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <strong>Teachers:</strong> {subject.teachers?.length || 0}
                      </span>
                    </div>

                    {subject.teachers && subject.teachers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <strong>Assigned Teachers:</strong>{" "}
                          {subject.teachers.map(t => 
                            `${t.user.firstName} ${t.user.lastName}`
                          ).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(subject)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(subject._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No subjects found. Create your first subject!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectManagement;