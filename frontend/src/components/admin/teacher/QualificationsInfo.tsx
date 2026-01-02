import React from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Qualification {
  degree: string;
  institution: string;
  year: string;
  grade?: string;
}

interface QualificationsProps {
  formData: {
    qualifications: Qualification[];
    subjects: string[];
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

const QualificationsInfo: React.FC<QualificationsProps> = ({
  formData,
  errors,
  onChange,
}) => {
  const addQualification = () => {
    const newQualification: Qualification = {
      degree: "",
      institution: "",
      year: "",
      grade: "",
    };
    onChange("qualifications", [...formData.qualifications, newQualification]);
  };

  const removeQualification = (index: number) => {
    const updatedQualifications = formData.qualifications.filter(
      (_, i) => i !== index
    );
    onChange("qualifications", updatedQualifications);
  };

  const updateQualification = (
    index: number,
    field: keyof Qualification,
    value: string
  ) => {
    const updatedQualifications = formData.qualifications.map((qual, i) =>
      i === index ? { ...qual, [field]: value } : qual
    );
    onChange("qualifications", updatedQualifications);
  };

  const addSubject = () => {
    onChange("subjects", [...formData.subjects, ""]);
  };

  const removeSubject = (index: number) => {
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
    onChange("subjects", updatedSubjects);
  };

  const updateSubject = (index: number, value: string) => {
    const updatedSubjects = formData.subjects.map((subject, i) =>
      i === index ? value : subject
    );
    onChange("subjects", updatedSubjects);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Qualifications & Subjects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Qualifications Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Educational Qualifications</h3>
            <Button
              type="button"
              onClick={addQualification}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Qualification
            </Button>
          </div>

          {formData.qualifications.map((qualification, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4 relative">
              <Button
                type="button"
                onClick={() => removeQualification(index)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree/Certificate *
                  </label>
                  <Input
                    value={qualification.degree}
                    onChange={(e) =>
                      updateQualification(index, "degree", e.target.value)
                    }
                    placeholder="e.g., B.Sc in Mathematics"
                    className={
                      errors[`qualifications.${index}.degree`]
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {errors[`qualifications.${index}.degree`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`qualifications.${index}.degree`]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution *
                  </label>
                  <Input
                    value={qualification.institution}
                    onChange={(e) =>
                      updateQualification(index, "institution", e.target.value)
                    }
                    placeholder="e.g., University of Dhaka"
                    className={
                      errors[`qualifications.${index}.institution`]
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {errors[`qualifications.${index}.institution`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`qualifications.${index}.institution`]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year of Completion *
                  </label>
                  <Input
                    value={qualification.year}
                    onChange={(e) =>
                      updateQualification(index, "year", e.target.value)
                    }
                    placeholder="e.g., 2018"
                    className={
                      errors[`qualifications.${index}.year`]
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {errors[`qualifications.${index}.year`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`qualifications.${index}.year`]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade/CGPA
                  </label>
                  <Input
                    value={qualification.grade}
                    onChange={(e) =>
                      updateQualification(index, "grade", e.target.value)
                    }
                    placeholder="e.g., 3.75/4.00"
                  />
                </div>
              </div>
            </div>
          ))}

          {formData.qualifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No qualifications added yet</p>
              <p className="text-sm">
                Click "Add Qualification" to get started
              </p>
            </div>
          )}
        </div>

        {/* Subjects Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Teaching Subjects</h3>
            <Button
              type="button"
              onClick={addSubject}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </div>

          {formData.subjects.map((subject, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <Input
                  value={subject}
                  onChange={(e) => updateSubject(index, e.target.value)}
                  placeholder="e.g., Mathematics, Physics, English"
                  className={
                    errors[`subjects.${index}`] ? "border-red-500" : ""
                  }
                />
                {errors[`subjects.${index}`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`subjects.${index}`]}
                  </p>
                )}
              </div>
              <Button
                type="button"
                onClick={() => removeSubject(index)}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {formData.subjects.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <p>No subjects added yet</p>
              <p className="text-sm">
                Click "Add Subject" to specify teaching subjects
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QualificationsInfo;
