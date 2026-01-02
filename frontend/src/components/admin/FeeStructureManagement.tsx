import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deactivateFeeStructure,
  cloneFeeStructure,
} from "../../services/fee.api";
import { FeeStructure, FeeType, CreateFeeStructureRequest } from "../../types/fee.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  Check,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

const FeeStructureManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(
    `${currentYear}-${currentYear + 1}`
  );
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState<CreateFeeStructureRequest>({
    school: user?.schoolId || "",
    grade: "",
    academicYear: selectedYear,
    feeComponents: [],
    dueDate: 10,
    lateFeePercentage: 2,
  });

  // Fetch school settings to get available grades
  const fetchSchoolSettings = async () => {
    if (!user?.schoolId) return;

    try {
      const response = await fetch("/api/admin/school/settings", {
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success && data.data?.settings?.grades) {
        // Convert grades to strings
        const grades = data.data.settings.grades.map((g: number) => g.toString());
        setAvailableGrades(grades);
      }
    } catch (err) {
      console.error("Failed to fetch school settings:", err);
      // Fallback to default grades if fetch fails
      setAvailableGrades(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
    }
  };

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    if (!user?.schoolId) return;

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        school: user.schoolId,
        academicYear: selectedYear,
      };

      if (selectedGrade !== "all") {
        params.grade = selectedGrade;
      }

      const response = await getFeeStructures(params);
      setFeeStructures(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch fee structures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  useEffect(() => {
    fetchFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedGrade, user?.schoolId]);

  // Format currency - without symbol
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0";
    }
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle create new
  const handleCreateNew = () => {
    setEditingStructure(null);
    setFormData({
      school: user?.schoolId || "",
      grade: "",
      academicYear: selectedYear,
      feeComponents: [],
      dueDate: 10,
      lateFeePercentage: 2,
    });
    setShowForm(true);
  };

  // Handle edit
  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      school: structure.school,
      grade: structure.grade,
      academicYear: structure.academicYear,
      feeComponents: structure.feeComponents.map((fc) => ({
        feeType: fc.feeType,
        amount: fc.amount,
        description: fc.description,
        isMandatory: fc.isMandatory,
        isOneTime: fc.isOneTime || false,
      })),
      dueDate: structure.dueDate,
      lateFeePercentage: structure.lateFeePercentage,
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this fee structure?")) {
      return;
    }

    try {
      await deactivateFeeStructure(id);
      setSuccess("Fee structure deactivated successfully");
      fetchFeeStructures();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to deactivate fee structure");
    }
  };

  // Handle clone
  const handleClone = async (id: string) => {
    const targetYear = prompt(
      "Enter target academic year (e.g., 2025-2026):",
      `${currentYear + 1}-${currentYear + 2}`
    );
    if (!targetYear) return;

    try {
      await cloneFeeStructure(id, targetYear);
      setSuccess(`Fee structure cloned to ${targetYear}`);
      fetchFeeStructures();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to clone fee structure");
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.feeComponents.length === 0) {
      setError("Please add at least one fee component");
      return;
    }

    // DEBUG: Log what we're sending

    try {
      if (editingStructure) {
        await updateFeeStructure(editingStructure._id, {
          feeComponents: formData.feeComponents,
          dueDate: formData.dueDate,
          lateFeePercentage: formData.lateFeePercentage,
        });
        setSuccess("Fee structure updated successfully");
      } else {
        await createFeeStructure(formData);
        setSuccess("Fee structure created successfully");
      }

      setShowForm(false);
      fetchFeeStructures();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save fee structure");
    }
  };

  // Add fee component
  const addFeeComponent = () => {
    setFormData({
      ...formData,
      feeComponents: [
        ...formData.feeComponents,
        { feeType: FeeType.TUITION, amount: 0, description: "", isMandatory: true, isOneTime: false },
      ],
    });
  };

  // Update fee component
  const updateFeeComponent = (index: number, field: string, value: any) => {
    const updated = formData.feeComponents.map((comp, i) => 
      i === index ? { ...comp, [field]: value } : comp
    );
    setFormData(prev => ({ ...prev, feeComponents: updated }));
  };

  // Remove fee component
  const removeFeeComponent = (index: number) => {
    setFormData({
      ...formData,
      feeComponents: formData.feeComponents.filter((_, i) => i !== index),
    });
  };

  // Calculate total yearly fee per student
  const calculateTotal = () => {
    const monthlyTotal = formData.feeComponents
      .filter(c => !c.isOneTime)
      .reduce((sum, c) => sum + c.amount, 0);
    const oneTimeTotal = formData.feeComponents
      .filter(c => c.isOneTime)
      .reduce((sum, c) => sum + c.amount, 0);
    return (monthlyTotal * 12) + oneTimeTotal;
  };

  if (loading && feeStructures.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Structure Management</h1>
          <p className="text-gray-500 mt-1">Manage fee structures for different grades</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Create Fee Structure
        </Button>
      </div>
 
 cd backend && npm run dev
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={`${currentYear - 1}-${currentYear}`}>
              {currentYear - 1}-{currentYear}
            </SelectItem>
            <SelectItem value={`${currentYear}-${currentYear + 1}`}>
              {currentYear}-{currentYear + 1}
            </SelectItem>
            <SelectItem value={`${currentYear + 1}-${currentYear + 2}`}>
              {currentYear + 1}-{currentYear + 2}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {availableGrades.map((grade) => (
              <SelectItem key={grade} value={grade}>
                Grade {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fee Structures List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feeStructures.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <p className="text-center text-gray-500">
                No fee structures found for the selected criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          feeStructures.map((structure) => (
            <Card key={structure._id} className={!structure.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Grade {structure.grade}</span>
                  {structure.isActive ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{structure.academicYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Monthly Fee</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ₹{formatCurrency(structure.totalMonthlyFee)}
                    </p>
                  </div>

                  {structure.feeComponents.some(c => !c.isOneTime) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        <span className="text-blue-600">📅</span>
                        Monthly Components:
                      </p>
                      <div className="space-y-1">
                        {structure.feeComponents
                          .filter(c => !c.isOneTime)
                          .map((component, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600 capitalize">
                              {component.feeType.replace("_", " ")}
                            </span>
                            <span className="font-medium">
                              ₹{formatCurrency(component.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {structure.feeComponents.some(c => c.isOneTime) && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 font-medium mb-2">One-Time Fees:</p>
                      <div className="space-y-1">
                        {structure.feeComponents
                          .filter(c => c.isOneTime)
                          .map((component, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-orange-700 capitalize font-medium">
                              {component.feeType === FeeType.ADMISSION ? '🎓' : component.feeType === FeeType.ANNUAL ? '📅' : '⚡'} {component.feeType}
                            </span>
                            <span className="font-bold text-orange-800">
                              ₹{formatCurrency(component.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Date</span>
                      <span className="font-medium">{structure.dueDate}th of month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Late Fee</span>
                      <span className="font-medium">{structure.lateFeePercentage}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(structure)}
                      disabled={!structure.isActive}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClone(structure._id)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Clone
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(structure._id)}
                      disabled={!structure.isActive}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
              </CardTitle>
              <CardDescription>
                {editingStructure
                  ? "Update the fee structure details"
                  : "Define fee structure for a grade"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Grade Selection */}
                {!editingStructure && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Grade *</label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) =>
                        setFormData({ ...formData, grade: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGrades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Academic Year */}
                {!editingStructure && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({ ...formData, academicYear: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., 2024-2025"
                      required
                    />
                  </div>
                )}

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Due Date (Day of Month) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                {/* Late Fee Percentage */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Late Fee Percentage *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.lateFeePercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lateFeePercentage: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                  {/* Fee Components */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Fee Components *</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addFeeComponent}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Component
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.feeComponents.map((component, index) => {
                      const isOneTimeFee = component.isOneTime;
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-3 border rounded-lg space-y-2 ${
                            isOneTimeFee ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs mb-1">Type</label>
                              <Select
                                value={component.feeType}
                                onValueChange={(value) =>
                                  updateFeeComponent(index, "feeType", value)
                                }
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={FeeType.TUITION}>Tuition</SelectItem>
                                  <SelectItem value={FeeType.TRANSPORT}>Transport</SelectItem>
                                  <SelectItem value={FeeType.HOSTEL}>Hostel</SelectItem>
                                  <SelectItem value={FeeType.LIBRARY}>Library</SelectItem>
                                  <SelectItem value={FeeType.LAB}>Lab</SelectItem>
                                  <SelectItem value={FeeType.SPORTS}>Sports</SelectItem>
                                  <SelectItem value={FeeType.EXAM}>Exam</SelectItem>
                                  <SelectItem value={FeeType.ADMISSION}>🎓 Admission
                                  </SelectItem>
                                  <SelectItem value={FeeType.ANNUAL}>📅 Annual
                                  </SelectItem>
                                  <SelectItem value={FeeType.OTHER}>Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-xs mb-1">
                                Amount {isOneTimeFee && <span className="text-orange-600">(One-Time)</span>}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={component.amount}
                                onChange={(e) =>
                                  updateFeeComponent(index, "amount", Number(e.target.value))
                                }
                                className="w-full px-2 py-1 border rounded text-sm"
                                required
                              />
                            </div>
                          </div>

                          <input
                            type="text"
                            value={component.description || ""}
                            onChange={(e) =>
                              updateFeeComponent(index, "description", e.target.value)
                            }
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder={isOneTimeFee ? 
                              "E.g., One-time admission fee for new students" : 
                              "Description (optional)"}
                          />

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              {/* Mandatory Checkbox */}
                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={component.isMandatory}
                                  onChange={(e) =>
                                    updateFeeComponent(index, "isMandatory", e.target.checked)
                                  }
                                  className="mr-2"
                                />
                                Mandatory
                              </label>

                              {/* Fee Type Radio Buttons */}
                              <div className="flex items-center gap-3 px-3 py-1 border rounded-md bg-gray-50">
                                <label className="flex items-center text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`feeType-${index}`}
                                    checked={!component.isOneTime}
                                    onChange={() => updateFeeComponent(index, "isOneTime", false)}
                                    className="mr-1.5 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="font-medium text-blue-700">Monthly</span>
                                </label>
                                <label className="flex items-center text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`feeType-${index}`}
                                    checked={component.isOneTime}
                                    onChange={() => updateFeeComponent(index, "isOneTime", true)}
                                    className="mr-1.5 text-orange-600 focus:ring-orange-500"
                                  />
                                  <span className={`font-medium ${isOneTimeFee ? 'text-orange-600' : 'text-gray-600'}`}>
                                    One-Time
                                  </span>
                                </label>
                              </div>

                              {/* Visual Badge */}
                              {isOneTimeFee && (
                                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium">
                                  ⚡ ONE-TIME
                                </span>
                              )}
                              {!isOneTimeFee && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                                  📅 MONTHLY
                                </span>
                              )}
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => removeFeeComponent(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total */}
                  {formData.feeComponents.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Monthly Fee</span>
                          <span className="text-xl font-bold text-blue-700">
                            {formatCurrency(
                              formData.feeComponents
                                .filter(c => !c.isOneTime)
                                .reduce((sum, c) => sum + c.amount, 0)
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Collected every month × 12 = ₹{formatCurrency(
                            formData.feeComponents
                              .filter(c => !c.isOneTime)
                              .reduce((sum, c) => sum + c.amount, 0) * 12
                          )}
                        </p>
                      </div>

                      {formData.feeComponents.some(c => c.isOneTime) && (
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-orange-800">One-Time Fees</span>
                            <span className="text-xl font-bold text-orange-700">
                              {formatCurrency(
                                formData.feeComponents
                                  .filter(c => c.isOneTime)
                                  .reduce((sum, c) => sum + c.amount, 0)
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-orange-600 mt-1">
                            Collected once per student (paid with first monthly payment)
                          </p>
                        </div>
                      )}

                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-800">Total Yearly Fee per Student</span>
                          <span className="text-xl font-bold text-green-700">
                            {formatCurrency(calculateTotal())}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Monthly fees × 12 + One-time fees
                        </p>
                      </div>
                    </div>
                  )}
                </div>                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingStructure ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FeeStructureManagement;
