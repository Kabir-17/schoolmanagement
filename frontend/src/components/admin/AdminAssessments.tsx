import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  Star,
  StarOff,
} from "lucide-react";

import { assessmentApi } from "@/services/assessment.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ClassInfo {
  grade: number;
  section: string;
  className: string;
  subjects?: Array<{ id: string; name: string }>;
}

interface AdminAssessmentListItem {
  id: string;
  examName: string;
  examTypeLabel?: string | null;
  examDate?: string | null;
  totalMarks: number;
  grade: number;
  section: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  teacher?: {
    id: string;
    name?: string;
  };
  category?: {
    id?: string;
    name?: string | null;
  };
  gradedCount: number;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  isFavorite: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminAssessmentSubjectGroup {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  totalAssessments: number;
  visibleAssessments: number;
  hiddenCount: number;
  favoritesCount: number;
  averagePercentage: number;
  latestExamDate?: string | null;
  assessments: AdminAssessmentListItem[];
}

interface AdminAssessmentOverview {
  totalAssessments: number;
  visibleAssessments: number;
  hiddenCount: number;
  favoritesCount: number;
  averagePercentage: number;
  lastUpdatedAt?: string | null;
}

interface AdminAssessmentResponse {
  overview: AdminAssessmentOverview;
  subjectGroups: AdminAssessmentSubjectGroup[];
  filters: {
    subjects: Array<{ id: string; name: string; code?: string }>;
    categories: Array<{ id: string; name: string }>;
    teachers: Array<{ id: string; name: string }>;
  };
}

const SORT_OPTIONS: Array<{
  label: string;
  value:
    | "examDate"
    | "averagePercentage"
    | "totalMarks"
    | "gradedCount"
    | "examName";
}> = [
  { label: "Exam Date", value: "examDate" },
  { label: "Average %", value: "averagePercentage" },
  { label: "Total Marks", value: "totalMarks" },
  { label: "Graded Entries", value: "gradedCount" },
  { label: "Exam Name", value: "examName" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "PP");
  } catch {
    return "—";
  }
};

const AdminAssessments: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);

  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [includeHidden, setIncludeHidden] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "examDate" | "averagePercentage" | "totalMarks" | "gradedCount" | "examName"
  >("examDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState<boolean>(false);
  const [adminData, setAdminData] = useState<AdminAssessmentResponse | null>(
    null
  );
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(
    () => new Set()
  );
  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, boolean>
  >({});
  const [initialisedDefaults, setInitialisedDefaults] = useState<boolean>(false);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);

    return () => window.clearTimeout(handler);
  }, [searchTerm]);

  const availableGrades = useMemo(
    () => Array.from(new Set(classes.map((cls) => cls.grade))).sort((a, b) => a - b),
    [classes]
  );

  const availableSections = useMemo(() => {
    if (!selectedGrade) {
      return classes.map((cls) => cls.section);
    }
    return classes
      .filter((cls) => String(cls.grade) === selectedGrade)
      .map((cls) => cls.section);
  }, [classes, selectedGrade]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await assessmentApi.getAdminClassCatalog();
      if (response.data.success) {
        const classList = (response.data.data || []) as any[];
        const mapped = classList.map((item: any) => ({
          grade: item.grade,
          section: item.section,
          className:
            item.className || `Grade ${item.grade} - Section ${item.section}`,
          subjects: (item.subjects || []).map((subject: any) => ({
            id: subject.id || subject._id || "",
            name: subject.name || String(subject),
          })),
        }));
        setClasses(mapped);

        if (!initialisedDefaults && mapped.length > 0) {
          const firstClass = mapped[0];
          setSelectedGrade(String(firstClass.grade));
          setSelectedSection(firstClass.section);
          setInitialisedDefaults(true);
        }
      }
    } catch (error) {
      console.error("Failed to load classes", error);
      toast.error("Unable to load class list. Please ensure classes are configured.");
    }
  }, [initialisedDefaults]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const loadAssessments = useCallback(async () => {
    if (!selectedGrade || !selectedSection) {
      setAdminData(null);
      setSelectedAssessments(new Set());
      return;
    }

    setLoading(true);
    try {
      const response = await assessmentApi.getAdminAssessments({
        grade: Number(selectedGrade),
        section: selectedSection,
        subjectId: subjectId || undefined,
        categoryId: categoryId || undefined,
        teacherId: teacherId || undefined,
        search: debouncedSearch || undefined,
        includeHidden,
        onlyFavorites,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortDirection,
      });

      if (response.data.success) {
        const payload = response.data.data as AdminAssessmentResponse;
        setAdminData(payload);

        const visibleIds = new Set<string>(
          payload.subjectGroups.flatMap((group) =>
            group.assessments.map((assessment) => assessment.id)
          )
        );

        setSelectedAssessments((previous) => {
          const next = new Set<string>();
          previous.forEach((id) => {
            if (visibleIds.has(id)) {
              next.add(id);
            }
          });
          return next;
        });

        setExpandedSubjects((previous) => {
          const next = { ...previous };
          payload.subjectGroups.forEach((group) => {
            if (next[group.subjectId] === undefined) {
              next[group.subjectId] = true;
            }
          });
          return next;
        });

        if (
          subjectId &&
          !payload.filters.subjects.some((subject) => subject.id === subjectId)
        ) {
          setSubjectId("");
        }

        if (
          categoryId &&
          !payload.filters.categories.some(
            (category) => category.id === categoryId
          )
        ) {
          setCategoryId("");
        }

        if (
          teacherId &&
          !payload.filters.teachers.some((teacher) => teacher.id === teacherId)
        ) {
          setTeacherId("");
        }
      }
    } catch (error: any) {
      console.error("Failed to load admin assessments", error);
      toast.error(error.response?.data?.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, [
    categoryId,
    debouncedSearch,
    fromDate,
    includeHidden,
    onlyFavorites,
    selectedGrade,
    selectedSection,
    sortBy,
    sortDirection,
    subjectId,
    teacherId,
    toDate,
  ]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const handlePreferenceUpdate = async (
    assessmentId: string,
    updates: { isFavorite?: boolean; isHidden?: boolean }
  ) => {
    try {
      await assessmentApi.updateAdminAssessmentPreference(
        assessmentId,
        updates
      );
      toast.success("Preference updated");
      await loadAssessments();
    } catch (error: any) {
      console.error("Failed to update preference", error);
      toast.error(
        error.response?.data?.message || "Unable to update assessment preference"
      );
    }
  };

  const toggleSubjectExpansion = (subjectIdValue: string) => {
    setExpandedSubjects((previous) => ({
      ...previous,
      [subjectIdValue]: !previous[subjectIdValue],
    }));
  };

  const toggleAssessmentSelection = (assessmentId: string) => {
    setSelectedAssessments((previous) => {
      const next = new Set(previous);
      if (next.has(assessmentId)) {
        next.delete(assessmentId);
      } else {
        next.add(assessmentId);
      }
      return next;
    });
  };

  const toggleSubjectSelection = (
    assessmentIds: string[],
    shouldSelect: boolean
  ) => {
    setSelectedAssessments((previous) => {
      const next = new Set(previous);
      assessmentIds.forEach((assessmentId) => {
        if (shouldSelect) {
          next.add(assessmentId);
        } else {
          next.delete(assessmentId);
        }
      });
      return next;
    });
  };

  const handleExport = async (
    format: "csv" | "xlsx",
    scope: "visible" | "selected"
  ) => {
    if (!selectedGrade || !selectedSection) {
      toast.error("Select a grade and section first");
      return;
    }

    const assessmentIds =
      scope === "selected" ? Array.from(selectedAssessments) : undefined;

    if (scope === "selected" && (!assessmentIds || assessmentIds.length === 0)) {
      toast.error("Select at least one assessment to export");
      return;
    }

    try {
      const response = await assessmentApi.exportAdminAssessments({
        grade: Number(selectedGrade),
        section: selectedSection,
        subjectId: subjectId || undefined,
        categoryId: categoryId || undefined,
        teacherId: teacherId || undefined,
        search: debouncedSearch || undefined,
        includeHidden,
        onlyFavorites,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortDirection,
        assessmentIds,
        format,
      });

      const blob = response.data;
      const fileLabel =
        scope === "selected" ? "selected-assessments" : "assessments";
      const filename = `grade${selectedGrade}-${selectedSection}-${fileLabel}.${format}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export assessments", error);
      toast.error(error.response?.data?.message || "Failed to export data");
    }
  };

  const resetFilters = () => {
    setSubjectId("");
    setCategoryId("");
    setTeacherId("");
    setSearchTerm("");
    setIncludeHidden(false);
    setOnlyFavorites(false);
    setFromDate("");
    setToDate("");
    setSortBy("examDate");
    setSortDirection("desc");
  };

  const subjectOptions = adminData?.filters.subjects ?? [];
  const categoryOptions = adminData?.filters.categories ?? [];
  const teacherOptions = adminData?.filters.teachers ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Assessment Explorer</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review assessment records, filter by subject or teacher, manage favourites, and export detailed reports.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Grade
            </label>
            <select
              value={selectedGrade}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedGrade(value);
                setSelectedSection("");
                setSubjectId("");
                setSelectedAssessments(new Set());
              }}
              className="h-10 w-full rounded-md border border-input px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select grade</option>
              {availableGrades.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(event) => {
                setSelectedSection(event.target.value);
                setSubjectId("");
                setSelectedAssessments(new Set());
              }}
              disabled={!selectedGrade}
              className="h-10 w-full rounded-md border border-input px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed"
            >
              <option value="">Select section</option>
              {availableSections.map((section) => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setSelectedAssessments(new Set());
              }}
              disabled={!selectedSection}
              className="h-10 w-full rounded-md border border-input px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                  {subject.code ? ` (${subject.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={!selectedSection}
              className="h-10 w-full rounded-md border border-input px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed"
            >
              <option value="">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

  <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              disabled={!selectedSection}
              className="h-10 w-full rounded-md border border-input px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed"
            >
              <option value="">All teachers</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search exam name, subject, type, or teacher"
                disabled={!selectedSection}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                disabled={!selectedSection}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                disabled={!selectedSection}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target
                    .value as (typeof SORT_OPTIONS)[number]["value"]
                )
              }
              disabled={!selectedSection}
              className="h-10 w-full rounded-md border border-input px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={sortDirection === "asc"}
                  onChange={(event) =>
                    setSortDirection(event.target.checked ? "asc" : "desc")
                  }
                  disabled={!selectedSection}
                />
                Ascending
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Visibility
            </label>
            <div className="space-y-2 rounded-md border border-dashed border-gray-200 p-3">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={includeHidden}
                  onChange={(event) => setIncludeHidden(event.target.checked)}
                  disabled={!selectedSection}
                />
                Include hidden assessments
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={onlyFavorites}
                  onChange={(event) => setOnlyFavorites(event.target.checked)}
                  disabled={!selectedSection}
                />
                Show favourites only
              </label>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => loadAssessments()}
              disabled={!selectedGrade || !selectedSection || loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={!selectedSection}
            >
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Snapshot of the assessments available with the current filters.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs uppercase text-gray-500">Total Assessments</p>
            <p className="text-2xl font-semibold text-gray-900">
              {adminData?.overview.totalAssessments ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs uppercase text-gray-500">
              Visible Assessments
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {adminData?.overview.visibleAssessments ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs uppercase text-gray-500">Favourites</p>
            <p className="text-2xl font-semibold text-gray-900">
              {adminData?.overview.favoritesCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs uppercase text-gray-500">Hidden</p>
            <p className="text-2xl font-semibold text-gray-900">
              {adminData?.overview.hiddenCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs uppercase text-gray-500">Average %</p>
            <p className="text-2xl font-semibold text-gray-900">
              {adminData?.overview.averagePercentage?.toFixed(1) ?? "0.0"}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Bulk Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Export assessments or update preferences for selected entries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport("csv", "visible")}
              disabled={!selectedSection || loading}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV (visible)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("xlsx", "visible")}
              disabled={!selectedSection || loading}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel (visible)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("csv", "selected")}
              disabled={
                !selectedSection || selectedAssessments.size === 0 || loading
              }
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV (selected)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("xlsx", "selected")}
              disabled={
                !selectedSection || selectedAssessments.size === 0 || loading
              }
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel (selected)
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading assessments...
          </CardContent>
        </Card>
      ) : !adminData || adminData.subjectGroups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {selectedGrade && selectedSection
              ? "No assessments match the selected filters."
              : "Select a grade and section to view assessments."}
          </CardContent>
        </Card>
      ) : (
        adminData.subjectGroups.map((group) => {
          const isExpanded = expandedSubjects[group.subjectId] ?? true;
          const subjectAssessments = group.assessments;
          const allSelected = subjectAssessments.every((assessment) =>
            selectedAssessments.has(assessment.id)
          );
          const someSelected =
            subjectAssessments.some((assessment) =>
              selectedAssessments.has(assessment.id)
            ) && !allSelected;

          return (
            <Card key={group.subjectId} className="overflow-hidden">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSubjectExpansion(group.subjectId)}
                    className="flex items-center gap-2 text-left text-lg font-semibold text-gray-900 hover:text-indigo-600 focus:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <span>
                      {group.subjectName}
                      {group.subjectCode ? ` (${group.subjectCode})` : ""}
                    </span>
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {group.visibleAssessments} visible of {group.totalAssessments}{" "}
                    assessments • Avg {group.averagePercentage.toFixed(1)}% •{" "}
                    Latest {formatDate(group.latestExamDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={allSelected}
                      ref={(element) => {
                        if (element) element.indeterminate = someSelected;
                      }}
                      onChange={(event) =>
                        toggleSubjectSelection(
                          group.assessments.map((assessment) => assessment.id),
                          event.target.checked
                        )
                      }
                    />
                    Select all in subject
                  </label>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="px-4 py-2">
                            <span className="sr-only">Select</span>
                          </th>
                          <th className="px-4 py-2">Exam</th>
                          <th className="px-4 py-2">Grade / Section</th>
                          <th className="px-4 py-2">Type</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2 text-center">Total</th>
                          <th className="px-4 py-2 text-center">Graded</th>
                          <th className="px-4 py-2 text-center">Average %</th>
                          <th className="px-4 py-2 text-center">High / Low</th>
                          <th className="px-4 py-2">Teacher</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {subjectAssessments.map((assessment) => {
                          const isSelected = selectedAssessments.has(
                            assessment.id
                          );

                          return (
                            <tr
                              key={assessment.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-2 align-middle">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleAssessmentSelection(assessment.id)
                                  }
                                />
                              </td>
                              <td className="px-4 py-2 align-middle">
                                <div className="font-medium text-gray-900">
                                  {assessment.examName}
                                </div>
                                {assessment.examTypeLabel ? (
                                  <p className="text-xs text-gray-500">
                                    {assessment.examTypeLabel}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-4 py-2 align-middle text-gray-600">
                                Grade {assessment.grade} • Section{" "}
                                {assessment.section}
                              </td>
                              <td className="px-4 py-2 align-middle text-gray-600">
                                {assessment.category?.name || "—"}
                              </td>
                              <td className="px-4 py-2 align-middle text-gray-600">
                                {formatDate(assessment.examDate)}
                              </td>
                              <td className="px-4 py-2 align-middle text-center text-gray-600">
                                {assessment.totalMarks}
                              </td>
                              <td className="px-4 py-2 align-middle text-center text-gray-600">
                                {assessment.gradedCount}
                              </td>
                              <td className="px-4 py-2 align-middle text-center text-gray-600">
                                {assessment.averagePercentage?.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2 align-middle text-center text-gray-600">
                                {assessment.highestPercentage?.toFixed(1)}% /{" "}
                                {assessment.lowestPercentage?.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2 align-middle text-gray-600">
                                {assessment.teacher?.name || "—"}
                              </td>
                              <td className="px-4 py-2 align-middle">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handlePreferenceUpdate(assessment.id, {
                                        isFavorite: !assessment.isFavorite,
                                      })
                                    }
                                    title={
                                      assessment.isFavorite
                                        ? "Remove from favourites"
                                        : "Mark as favourite"
                                    }
                                  >
                                    {assessment.isFavorite ? (
                                      <Star className="h-4 w-4 text-amber-500" />
                                    ) : (
                                      <StarOff className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handlePreferenceUpdate(assessment.id, {
                                        isHidden: !assessment.isHidden,
                                      })
                                    }
                                    title={
                                      assessment.isHidden
                                        ? "Unhide assessment"
                                        : "Hide assessment"
                                    }
                                  >
                                    {assessment.isHidden ? (
                                      <Eye className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
};

export default AdminAssessments;
