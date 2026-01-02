import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Save,
  SortAsc,
  SortDesc,
  Table2,
  Target,
} from "lucide-react";

import { assessmentApi } from "@/services/assessment.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TeacherAssignment {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  grade: number;
  section: string;
  classId?: string;
  className: string;
  studentsCount: number;
  scheduleDays: string[];
}

interface AssessmentSummary {
  assessmentId: string;
  examName: string;
  examTypeLabel?: string | null;
  examDate: string;
  totalMarks: number;
  gradedCount: number;
  totalStudents: number;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
}

interface AssessmentsPayload {
  assessments: AssessmentSummary[];
  stats: {
    totalAssessments: number;
    totalStudentsEvaluated: number;
    averagePercentage: number;
  };
}

interface AssessmentDetails {
  assessment: {
    id: string;
    examName: string;
    examTypeLabel?: string | null;
    examDate: string;
    totalMarks: number;
    grade: number;
    section: string;
    note?: string;
    academicYear?: string;
    subject: any;
  };
  students: Array<{
    studentId: string;
    studentCode: string;
    studentName: string;
    rollNumber?: number;
    marksObtained: number | null;
    percentage: number | null;
    grade: string | null;
    remarks: string;
  }>;
}

interface PerformanceMatrix {
  assessments: Array<{
    id: string;
    examName: string;
    examTypeLabel?: string | null;
    examDate: string;
    totalMarks: number;
    gradedCount: number;
    averagePercentage: number;
  }>;
  students: Array<{
    studentId: string;
    studentName: string;
    rollNumber?: number;
    results: Record<
      string,
      {
        marksObtained: number;
        percentage: number;
        grade: string;
        remarks?: string;
      }
    >;
    totals: {
      obtained: number;
      total: number;
      averagePercentage: number;
    };
  }>;
}

interface CategoryOption {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

type SortKey = "name" | "roll" | "marks-desc" | "marks-asc";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const TeacherExamGrading: React.FC = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<TeacherAssignment | null>(null);

  const [assessmentSummary, setAssessmentSummary] =
    useState<AssessmentsPayload | null>(null);
  const [loadingAssessments, setLoadingAssessments] =
    useState<boolean>(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [showAssessmentForm, setShowAssessmentForm] = useState<boolean>(false);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentSummary | null>(null);

  const [details, setDetails] = useState<AssessmentDetails | null>(null);
  const [markDrafts, setMarkDrafts] = useState<
    Record<
      string,
      {
        marksObtained: string;
        remarks: string;
      }
    >
  >({});
  const [savingMarks, setSavingMarks] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<SortKey>("roll");

  const [performanceMatrix, setPerformanceMatrix] =
    useState<PerformanceMatrix | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"overview" | "performance">(
    "overview"
  );

  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const response = await assessmentApi.getTeacherAssignments();
      if (response.data.success) {
        const assignmentList = response.data.data as TeacherAssignment[];
        setAssignments(assignmentList);
        if (!selectedAssignment && assignmentList.length > 0) {
          setSelectedAssignment(assignmentList[0]);
        }
      }
    } catch (error: any) {
      console.error("Failed to load assignments", error);
      toast.error(
        error.response?.data?.message || "Failed to load class assignments"
      );
    } finally {
      setLoadingAssignments(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await assessmentApi.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.warn("Failed to load assessment categories", error);
    }
  };

  const loadAssessments = async (assignment: TeacherAssignment | null) => {
    if (!assignment) {
      setAssessmentSummary(null);
      return;
    }

    try {
      setLoadingAssessments(true);
      const response = await assessmentApi.getTeacherAssessments({
        subjectId: assignment.subjectId,
        grade: assignment.grade,
        section: assignment.section,
      });

      if (response.data.success) {
        setAssessmentSummary(response.data.data as AssessmentsPayload);
      }
    } catch (error: any) {
      console.error("Failed to load assessments", error);
      toast.error(
        error.response?.data?.message || "Failed to load assessments"
      );
    } finally {
      setLoadingAssessments(false);
    }
  };

  useEffect(() => {
    loadAssignments();
    loadCategories();
  }, []);

  useEffect(() => {
    loadAssessments(selectedAssignment);
    setDetails(null);
    setPerformanceMatrix(null);
  }, [selectedAssignment]);

  const handleSelectAssignment = (assignmentId: string) => {
    const assignment = assignments.find((item) =>
      `${item.subjectId}-${item.grade}-${item.section}` === assignmentId
    );
    if (assignment) {
      setSelectedAssignment(assignment);
    }
  };

  const handleOpenCreate = () => {
    setEditingAssessment(null);
    setShowAssessmentForm(true);
  };

  const handleOpenEdit = (summary: AssessmentSummary) => {
    setEditingAssessment(summary);
    setShowAssessmentForm(true);
  };

  const handleCreateOrUpdate = async (form: {
    examName: string;
    examDate: string;
    totalMarks: number;
    note?: string;
    categoryId?: string;
    categoryLabel?: string;
  }) => {
    if (!selectedAssignment) return;

    try {
      if (editingAssessment) {
        await assessmentApi.updateAssessment(editingAssessment.assessmentId, {
          examName: form.examName,
          examDate: form.examDate,
          totalMarks: form.totalMarks,
          note: form.note,
          categoryId: form.categoryId || null,
          categoryLabel: form.categoryLabel || null,
        });
        toast.success("Assessment updated");
      } else {
        await assessmentApi.createAssessment({
          subjectId: selectedAssignment.subjectId,
          subjectName: selectedAssignment.subjectName,
          grade: selectedAssignment.grade,
          section: selectedAssignment.section,
          examName: form.examName,
          examDate: form.examDate,
          totalMarks: form.totalMarks,
          note: form.note,
          categoryId: form.categoryId,
          categoryLabel: form.categoryLabel,
        });
        toast.success("Assessment created");
      }

      setShowAssessmentForm(false);
      await loadAssessments(selectedAssignment);
      setEditingAssessment(null);
    } catch (error: any) {
      console.error("Failed to persist assessment", error);
      toast.error(
        error.response?.data?.message || "Failed to save assessment"
      );
    }
  };

  const handleDeleteAssessment = async (summary: AssessmentSummary) => {
    if (!selectedAssignment) return;
    if (!window.confirm(`Delete assessment "${summary.examName}"?`)) {
      return;
    }

    try {
      await assessmentApi.deleteAssessment(summary.assessmentId);
      toast.success("Assessment archived");
      await loadAssessments(selectedAssignment);
      if (details?.assessment.id === summary.assessmentId) {
        setDetails(null);
      }
    } catch (error: any) {
      console.error("Failed to delete assessment", error);
      toast.error(
        error.response?.data?.message || "Failed to delete assessment"
      );
    }
  };

  const loadAssessmentDetails = async (assessmentId: string) => {
    try {
      const response = await assessmentApi.getAssessmentDetails(assessmentId);
      if (response.data.success) {
        const payload = response.data.data as AssessmentDetails;
        setDetails(payload);
        const initialDrafts = payload.students.reduce(
          (acc, student) => {
            acc[student.studentId] = {
              marksObtained:
                student.marksObtained !== null
                  ? String(student.marksObtained)
                  : "",
              remarks: student.remarks || "",
            };
            return acc;
          },
          {} as Record<string, { marksObtained: string; remarks: string }>
        );
        setMarkDrafts(initialDrafts);
      }
    } catch (error: any) {
      console.error("Failed to load assessment details", error);
      toast.error(
        error.response?.data?.message || "Failed to load assessment details"
      );
    } finally {
      // no-op
    }
  };

  const handleMarkChange = (
    studentId: string,
    field: "marksObtained" | "remarks",
    value: string
  ) => {
    setMarkDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveMarks = async () => {
    if (!details) return;
    try {
      setSavingMarks(true);
      const payload = Object.entries(markDrafts)
        .filter(([_, draft]) => draft.marksObtained !== "")
        .map(([studentId, draft]) => ({
          studentId,
          marksObtained: Number(draft.marksObtained),
          remarks: draft.remarks?.trim() || undefined,
        }));

      await assessmentApi.submitAssessmentResults(details.assessment.id, payload);
      toast.success("Assessment grades saved");
      await loadAssessmentDetails(details.assessment.id);
      if (selectedAssignment) {
        await loadAssessments(selectedAssignment);
      }
    } catch (error: any) {
      console.error("Failed to save marks", error);
      toast.error(error.response?.data?.message || "Failed to save marks");
    } finally {
      setSavingMarks(false);
    }
  };

  const sortedStudents = useMemo(() => {
    if (!details) return [];
    const students = [...details.students];
    switch (sortKey) {
      case "name":
        students.sort((a, b) => a.studentName.localeCompare(b.studentName));
        break;
      case "roll":
        students.sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0));
        break;
      case "marks-desc":
        students.sort((a, b) => {
          const markA = markDrafts[a.studentId]?.marksObtained || "";
          const markB = markDrafts[b.studentId]?.marksObtained || "";
          return Number(markB || -1) - Number(markA || -1);
        });
        break;
      case "marks-asc":
        students.sort((a, b) => {
          const markA = markDrafts[a.studentId]?.marksObtained || "";
          const markB = markDrafts[b.studentId]?.marksObtained || "";
          return Number(markA || -1) - Number(markB || -1);
        });
        break;
      default:
        break;
    }
    return students;
  }, [details, sortKey, markDrafts]);

  const handleLoadPerformance = async () => {
    if (!selectedAssignment) return;
    try {
      setLoadingMatrix(true);
      const response = await assessmentApi.getPerformanceMatrix({
        subjectId: selectedAssignment.subjectId,
        grade: selectedAssignment.grade,
        section: selectedAssignment.section,
      });
      if (response.data.success) {
        setPerformanceMatrix(response.data.data as PerformanceMatrix);
      }
    } catch (error: any) {
      console.error("Failed to load performance matrix", error);
      toast.error(
        error.response?.data?.message || "Failed to load performance matrix"
      );
    } finally {
      setLoadingMatrix(false);
    }
  };

  const handleExportAssessment = async (
    assessmentId: string,
    format: "csv" | "xlsx"
  ) => {
    try {
      const response = await assessmentApi.exportAssessment(
        assessmentId,
        format
      );
      downloadBlob(
        response.data,
        `assessment-${assessmentId}.${format === "csv" ? "csv" : "xlsx"}`
      );
      toast.success("Assessment exported");
    } catch (error: any) {
      console.error("Failed to export assessment", error);
      toast.error(
        error.response?.data?.message || "Failed to export assessment"
      );
    }
  };

  const handleExportSummary = async (format: "csv" | "xlsx") => {
    if (!selectedAssignment) return;
    try {
      const response = await assessmentApi.exportTeacherAssessments({
        subjectId: selectedAssignment.subjectId,
        grade: selectedAssignment.grade,
        section: selectedAssignment.section,
        format,
      });
      downloadBlob(
        response.data,
        `assessment-summary-${selectedAssignment.grade}${selectedAssignment.section}.${
          format === "csv" ? "csv" : "xlsx"
        }`
      );
      toast.success("Assessment summary exported");
    } catch (error: any) {
      console.error("Failed to export summary", error);
      toast.error(
        error.response?.data?.message || "Failed to export summary"
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Assessments & Grading
            </CardTitle>
            <p className="text-sm text-gray-500">
              Create exams, record marks, and monitor class performance
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={
                selectedAssignment
                  ? `${selectedAssignment.subjectId}-${selectedAssignment.grade}-${selectedAssignment.section}`
                  : ""
              }
              onChange={(event) => handleSelectAssignment(event.target.value)}
              disabled={loadingAssignments || assignments.length === 0}
              className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <option value="" disabled>
                {loadingAssignments
                  ? "Loading assignments..."
                  : "Select class & subject"}
              </option>
              {assignments.map((assignment) => (
                <option
                  key={`${assignment.subjectId}-${assignment.grade}-${assignment.section}`}
                  value={`${assignment.subjectId}-${assignment.grade}-${assignment.section}`}
                >
                  {assignment.className} • {assignment.subjectName}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => loadAssessments(selectedAssignment)}
                disabled={!selectedAssignment || loadingAssessments}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button
                onClick={handleOpenCreate}
                disabled={!selectedAssignment}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {selectedAssignment && assessmentSummary && (
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">
                {selectedAssignment.className} • {selectedAssignment.subjectName}
              </CardTitle>
              <p className="text-sm text-gray-500">
                Teaching days: {selectedAssignment.scheduleDays.join(", ") || "N/A"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeView === "overview" ? "default" : "outline"}
                onClick={() => setActiveView("overview")}
              >
                <Table2 className="w-4 h-4 mr-2" /> Overview
              </Button>
              <Button
                variant={activeView === "performance" ? "default" : "outline"}
                onClick={() => {
                  setActiveView("performance");
                  if (!performanceMatrix) {
                    handleLoadPerformance();
                  }
                }}
              >
                <BarChart3 className="w-4 h-4 mr-2" /> Performance Matrix
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatTile
                title="Assessments"
                value={assessmentSummary.stats.totalAssessments}
                description="Active exams"
                icon={CalendarDays}
                bgClass="bg-indigo-50"
              />
              <StatTile
                title="Graded Entries"
                value={assessmentSummary.stats.totalStudentsEvaluated}
                description="Students graded"
                icon={BookOpen}
                bgClass="bg-green-50"
              />
              <StatTile
                title="Average %"
                value={`${assessmentSummary.stats.averagePercentage.toFixed(1)}%`}
                description="Across all exams"
                icon={Target}
                bgClass="bg-amber-50"
              />
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handleExportSummary("csv")}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportSummary("xlsx")}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === "overview" && (
        <AssessmentTable
          loading={loadingAssessments}
          assessments={assessmentSummary?.assessments || []}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteAssessment}
          onOpenDetails={(id) => loadAssessmentDetails(id)}
          onExport={handleExportAssessment}
        />
      )}

      {activeView === "performance" && (
        <PerformanceMatrixView
          loading={loadingMatrix}
          matrix={performanceMatrix}
          onRefresh={handleLoadPerformance}
        />
      )}

      {details && (
        <AssessmentDetailCard
          assessment={details}
          students={sortedStudents}
          markDrafts={markDrafts}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onChange={handleMarkChange}
          onSave={handleSaveMarks}
          saving={savingMarks}
          onExport={handleExportAssessment}
        />
      )}

      <AssessmentFormDialog
        open={showAssessmentForm}
        onClose={() => {
          setShowAssessmentForm(false);
          setEditingAssessment(null);
        }}
        categories={categories}
        onSubmit={handleCreateOrUpdate}
        initialData={editingAssessment}
        assignment={selectedAssignment}
      />
    </div>
  );
};

interface StatTileProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
}

const StatTile: React.FC<StatTileProps> = ({
  title,
  value,
  description,
  icon: Icon,
  bgClass,
}) => {
  return (
    <div className={`p-4 rounded-xl border border-gray-200 ${bgClass}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

interface AssessmentTableProps {
  loading: boolean;
  assessments: AssessmentSummary[];
  onOpenDetails: (id: string) => void;
  onEdit: (summary: AssessmentSummary) => void;
  onDelete: (summary: AssessmentSummary) => void;
  onExport: (assessmentId: string, format: "csv" | "xlsx") => void;
}

const AssessmentTable: React.FC<AssessmentTableProps> = ({
  loading,
  assessments,
  onOpenDetails,
  onEdit,
  onDelete,
  onExport,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">
          Loading assessments...
        </CardContent>
      </Card>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500 text-center">
          No assessments found. Click "New Assessment" to add the first one.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessments</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full border divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Exam
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Date
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Total Marks
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Graded
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Avg %
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Highest
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Lowest
              </th>
              <th className="px-4 py-2 text-right font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assessments.map((assessment) => (
              <tr key={assessment.assessmentId} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">
                    {assessment.examName}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assessment.examTypeLabel || "—"}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {format(new Date(assessment.examDate), "PP")}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assessment.totalMarks}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assessment.gradedCount}/{assessment.totalStudents}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assessment.averagePercentage.toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assessment.highestPercentage?.toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assessment.lowestPercentage?.toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenDetails(assessment.assessmentId)}
                    >
                      Grade
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(assessment)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(assessment)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onExport(assessment.assessmentId, "xlsx")}
                    >
                      Export
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

interface AssessmentDetailCardProps {
  assessment: AssessmentDetails;
  students: AssessmentDetails["students"];
  markDrafts: Record<string, { marksObtained: string; remarks: string }>;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  onChange: (
    studentId: string,
    field: "marksObtained" | "remarks",
    value: string
  ) => void;
  onSave: () => void;
  saving: boolean;
  onExport: (assessmentId: string, format: "csv" | "xlsx") => void;
}

const AssessmentDetailCard: React.FC<AssessmentDetailCardProps> = ({
  assessment,
  students,
  markDrafts,
  sortKey,
  onSortChange,
  onChange,
  onSave,
  saving,
  onExport,
}) => {
  const totalMarks = assessment.assessment.totalMarks;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">{assessment.assessment.examName}</CardTitle>
          <p className="text-sm text-gray-500">
            {assessment.assessment.examTypeLabel || "Assessment"} • {format(new Date(assessment.assessment.examDate), "PP")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onExport(assessment.assessment.id, "csv")}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport(assessment.assessment.id, "xlsx")}
          >
            Excel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-500">
            Enter marks out of {totalMarks}. Leave blank for pending students.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Sort By
            </span>
            <Button
              size="sm"
              variant={sortKey === "roll" ? "default" : "outline"}
              onClick={() => onSortChange("roll")}
            >
              Roll
            </Button>
            <Button
              size="sm"
              variant={sortKey === "name" ? "default" : "outline"}
              onClick={() => onSortChange("name")}
            >
              Name
            </Button>
            <Button
              size="sm"
              variant={sortKey === "marks-desc" ? "default" : "outline"}
              onClick={() => onSortChange("marks-desc")}
            >
              <SortDesc className="w-4 h-4 mr-1" /> Marks
            </Button>
            <Button
              size="sm"
              variant={sortKey === "marks-asc" ? "default" : "outline"}
              onClick={() => onSortChange("marks-asc")}
            >
              <SortAsc className="w-4 h-4 mr-1" /> Marks
            </Button>
          </div>
        </div>
        <table className="min-w-full border divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Roll</th>
              <th className="px-4 py-2 text-left">Student</th>
              <th className="px-4 py-2 text-left">Marks</th>
              <th className="px-4 py-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => (
              <tr key={student.studentId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500">
                  {student.rollNumber ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">
                    {student.studentName}
                  </div>
                  <p className="text-xs text-gray-500">
                    {student.studentCode}
                  </p>
                </td>
                <td className="px-4 py-2 w-32">
                  <Input
                    type="number"
                    min={0}
                    max={totalMarks}
                    value={markDrafts[student.studentId]?.marksObtained || ""}
                    onChange={(event) =>
                      onChange(student.studentId, "marksObtained", event.target.value)
                    }
                    placeholder="—"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={markDrafts[student.studentId]?.remarks || ""}
                    onChange={(event) =>
                      onChange(student.studentId, "remarks", event.target.value)
                    }
                    placeholder="Optional remarks"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

interface PerformanceMatrixViewProps {
  loading: boolean;
  matrix: PerformanceMatrix | null;
  onRefresh: () => void;
}

const PerformanceMatrixView: React.FC<PerformanceMatrixViewProps> = ({
  loading,
  matrix,
  onRefresh,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">
          Loading performance matrix...
        </CardContent>
      </Card>
    );
  }

  if (!matrix) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">
          Performance data will appear here once generated.
          <Button variant="outline" className="ml-3" onClick={onRefresh}>
            Generate Matrix
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Class Performance Matrix</CardTitle>
          <p className="text-sm text-gray-500">
            Compare student performance across all assessments.
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full border divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Roll</th>
              <th className="px-4 py-2 text-left">Student</th>
              {matrix.assessments.map((assessment) => (
                <th key={assessment.id} className="px-4 py-2 text-left">
                  <div className="font-semibold text-gray-700">
                    {assessment.examName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(assessment.examDate), "PP")}
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Avg %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matrix.students.map((student) => (
              <tr key={student.studentId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500">
                  {student.rollNumber ?? "—"}
                </td>
                <td className="px-4 py-2 text-gray-900 font-medium">
                  {student.studentName}
                </td>
                {matrix.assessments.map((assessment) => {
                  const result = student.results[assessment.id];
                  return (
                    <td key={assessment.id} className="px-4 py-2 text-gray-600">
                      {result
                        ? `${result.marksObtained}/${assessment.totalMarks} (${result.percentage.toFixed(1)}%)`
                        : "—"}
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-gray-700">
                  {student.totals.obtained}/{student.totals.total}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {student.totals.averagePercentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

interface AssessmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    examName: string;
    examDate: string;
    totalMarks: number;
    note?: string;
    categoryId?: string;
    categoryLabel?: string;
  }) => Promise<void> | void;
  categories: CategoryOption[];
  initialData: AssessmentSummary | null;
  assignment: TeacherAssignment | null;
}

const AssessmentFormDialog: React.FC<AssessmentFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  categories,
  initialData,
  assignment,
}) => {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("" );
  const [totalMarks, setTotalMarks] = useState("100");
  const [note, setNote] = useState("" );
  const [categoryId, setCategoryId] = useState<string>("" );
  const [customType, setCustomType] = useState("" );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setExamName(initialData.examName);
      setExamDate(format(new Date(initialData.examDate), "yyyy-MM-dd"));
      setTotalMarks(String(initialData.totalMarks));
      setNote("");
      setCategoryId("");
      setCustomType(initialData.examTypeLabel || "");
    } else if (assignment) {
      setExamName(`${assignment.subjectName} Assessment`);
      setExamDate(format(new Date(), "yyyy-MM-dd"));
      setTotalMarks("100");
      setNote("");
      setCategoryId("");
      setCustomType("");
    }
  }, [initialData, assignment, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!examName || !examDate || !totalMarks) {
      toast.error("Please complete exam name, date, and total marks");
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        examName,
        examDate,
        totalMarks: Number(totalMarks),
        note: note?.trim() || undefined,
        categoryId: categoryId || undefined,
        categoryLabel: categoryId ? undefined : customType || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Assessment" : "Create Assessment"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {assignment
              ? `${assignment.className} • ${assignment.subjectName}`
              : "Select a class first"}
          </p>
        </DialogHeader>

        <form
          id="assessment-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="examName">Exam Name</Label>
            <Input
              id="examName"
              value={examName}
              onChange={(event) => setExamName(event.target.value)}
              placeholder="e.g., Quiz 1"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examDate">Date</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(event) => setExamDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                min={1}
                max={1000}
                value={totalMarks}
                onChange={(event) => setTotalMarks(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Assessment Type</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                if (event.target.value) {
                  const selected = categories.find(
                    (item) => item.id === event.target.value
                  );
                  setCustomType(selected?.name || "");
                }
              }}
              className="h-10 rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Custom</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {!categoryId && (
              <Input
                placeholder="e.g., Weekly Quiz"
                value={customType}
                onChange={(event) => setCustomType(event.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes (optional)</Label>
            <Input
              id="note"
              placeholder="Enter additional notes"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="assessment-form" disabled={saving}>
            {saving ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherExamGrading;
