import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { TrendingUp, Award, GaugeCircle, BookOpen } from "lucide-react";

import { apiService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface AssessmentEntry {
  assessmentId: string;
  examName: string;
  examTypeLabel?: string | null;
  examDate: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  subjectName: string;
  teacherName?: string;
}

interface SubjectAssessments {
  subjectId: string;
  subjectName: string;
  assessments: AssessmentEntry[];
  totals: {
    obtained: number;
    total: number;
    averagePercentage: number;
  };
}

interface StudentAssessmentOverview {
  overall: {
    totalAssessments: number;
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
  };
  subjects: SubjectAssessments[];
  recent: AssessmentEntry[];
}

const GradeView: React.FC = () => {
  const [data, setData] = useState<StudentAssessmentOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await apiService.student.getGrades();
        if (response.data.success) {
          setData(response.data.data as StudentAssessmentOverview);
        } else {
          setError("Unable to load assessment data");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load assessment data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const recentAssessments = useMemo(() => {
    if (!data?.recent) return [];
    return data.recent.slice(0, 8);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-24 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-red-600">
          {error || "No assessment data available."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Assessments"
              value={data.overall.totalAssessments}
              description="Completed exams"
              icon={BookOpen}
              accent="bg-sky-50"
            />
            <StatCard
              title="Average Percentage"
              value={`${data.overall.averagePercentage.toFixed(1)}%`}
              description="Across all subjects"
              icon={TrendingUp}
              accent="bg-emerald-50"
            />
            <StatCard
              title="Highest Score"
              value={`${data.overall.highestPercentage.toFixed(1)}%`}
              description="Best exam performance"
              icon={Award}
              accent="bg-amber-50"
            />
            <StatCard
              title="Lowest Score"
              value={`${data.overall.lowestPercentage.toFixed(1)}%`}
              description="Focus for improvement"
              icon={GaugeCircle}
              accent="bg-rose-50"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare your performance across subjects and drill into each exam.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.subjects.map((subject) => (
            <div key={subject.subjectId} className="border rounded-lg">
              <div className="border-b px-4 py-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {subject.subjectName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Average {subject.totals.averagePercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {subject.totals.obtained}/{subject.totals.total} marks
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">
                        Exam
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">
                        Marks
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">
                        Percentage
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subject.assessments.map((assessment) => (
                      <tr key={assessment.assessmentId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900 font-medium">
                          {assessment.examName}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {assessment.examTypeLabel || "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {format(new Date(assessment.examDate), "PP")}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {assessment.marksObtained}/{assessment.totalMarks}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {assessment.percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2">
                          <GradeBadge grade={assessment.grade} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest marks across all subjects.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent assessments recorded.
            </p>
          ) : (
            recentAssessments.map((assessment) => (
              <div
                key={`${assessment.assessmentId}-${assessment.examDate}`}
                className="border rounded-lg p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500">
                      {assessment.subjectName}
                    </p>
                    <h4 className="text-base font-semibold text-gray-900">
                      {assessment.examName}
                    </h4>
                  </div>
                  <GradeBadge grade={assessment.grade} />
                </div>
                <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                  <span>
                    {assessment.marksObtained}/{assessment.totalMarks} marks
                  </span>
                  <span>{assessment.percentage.toFixed(1)}%</span>
                  <span>{format(new Date(assessment.examDate), "PP")}</span>
                </div>
                {assessment.remarks && (
                  <p className="text-xs text-gray-500">{assessment.remarks}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  accent,
}) => (
  <div className={`rounded-lg border border-gray-200 p-4 ${accent}`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon className="w-5 h-5 text-gray-700" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const colorMap: Record<string, string> = {
    "A+": "bg-green-100 text-green-700",
    A: "bg-green-100 text-green-700",
    "B+": "bg-blue-100 text-blue-700",
    B: "bg-blue-100 text-blue-700",
    "C+": "bg-amber-100 text-amber-700",
    C: "bg-amber-100 text-amber-700",
    D: "bg-orange-100 text-orange-700",
    F: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
        colorMap[grade] || "bg-gray-100 text-gray-700"
      }`}
    >
      {grade || "—"}
    </span>
  );
};

export default GradeView;
