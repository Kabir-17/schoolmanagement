import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/services/admin.api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";

interface ClassRow {
  id: string;
  grade: number;
  section: string;
  className: string;
  absenceSmsSettings: {
    enabled: boolean;
    sendAfterTime: string;
  };
  isSaving?: boolean;
}

const AttendanceSmsSettings: React.FC = () => {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterSection, setFilterSection] = useState<string>("");
  const { showToast } = useToast();

  useEffect(() => {
    void loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getClasses({ limit: 100, page: 1 });
      if (response.data.success) {
        const data = response.data.data;
        const classes = data?.classes || data?.data || [];
        const mapped: ClassRow[] = classes.map((item: any) => ({
          id: item.id,
          grade: item.grade,
          section: item.section,
          className: item.className,
          absenceSmsSettings: {
            enabled: Boolean(item.absenceSmsSettings?.enabled),
            sendAfterTime:
              item.absenceSmsSettings?.sendAfterTime || "11:00",
          },
        }));
        setRows(mapped);
      } else {
        showToast("Failed to load classes for SMS settings.", "error");
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
      showToast("Unable to load class data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesGrade = filterGrade
        ? row.grade === Number(filterGrade)
        : true;
      const matchesSection = filterSection
        ? row.section.toLowerCase() === filterSection.toLowerCase()
        : true;
      return matchesGrade && matchesSection;
    });
  }, [rows, filterGrade, filterSection]);

  const updateRow = (id: string, updates: Partial<ClassRow["absenceSmsSettings"]>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              absenceSmsSettings: {
                ...row.absenceSmsSettings,
                ...updates,
              },
            }
          : row
      )
    );
  };

  const toggleEnabled = (row: ClassRow) => {
    updateRow(row.id, { enabled: !row.absenceSmsSettings.enabled });
  };

  const handleTimeChange = (row: ClassRow, value: string) => {
    updateRow(row.id, { sendAfterTime: value });
  };

  const handleSave = async (row: ClassRow) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === row.id ? { ...item, isSaving: true } : item
      )
    );

    try {
      const payload = {
        absenceSmsSettings: {
          enabled: row.absenceSmsSettings.enabled,
          sendAfterTime: row.absenceSmsSettings.sendAfterTime,
        },
      };
      const response = await adminApi.updateClass(row.id, payload);
      if (response.data.success) {
        showToast(
          `Absence SMS settings updated for ${row.className}.`,
          "success"
        );
      } else {
        showToast(
          response.data.message ||
            "Failed to update absence SMS settings.",
          "error"
        );
      }
    } catch (error: any) {
      console.error("Failed to update absence SMS setting:", error);
      const message =
        error?.response?.data?.message ||
        "Unable to save the setting. Please retry.";
      showToast(message, "error");
    } finally {
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, isSaving: false } : item
        )
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Absent SMS Dispatch Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-700">
          <p>
            Configure the classes that should trigger automatic SMS alerts
            when a student remains absent beyond the configured time. Only
            students marked absent by teachers will trigger messages.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            <li>
              SMS messages use the Orange API credentials configured by the
              superadmin.
            </li>
            <li>
              The cutoff time uses the global timezone configured for the
              platform.
            </li>
            <li>
              Alerts are skipped if teachers later mark the student present.
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter Grade
          </label>
          <Input
            type="number"
            min={1}
            max={12}
            value={filterGrade}
            onChange={(event) => setFilterGrade(event.target.value)}
            placeholder="All"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter Section
          </label>
          <Input
            value={filterSection}
            onChange={(event) => setFilterSection(event.target.value)}
            placeholder="All"
          />
        </div>
        <div className="flex items-end pb-1">
          <Button variant="outline" onClick={() => void loadClasses()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Class
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Enabled
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Send After
              </th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  Loading class data...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  No classes found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {row.className}
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={row.absenceSmsSettings.enabled}
                        onChange={() => toggleEnabled(row)}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {row.absenceSmsSettings.enabled ? "Active" : "Off"}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="time"
                      value={row.absenceSmsSettings.sendAfterTime}
                      disabled={!row.absenceSmsSettings.enabled}
                      onChange={(event) =>
                        handleTimeChange(row, event.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      disabled={row.isSaving}
                      onClick={() => void handleSave(row)}
                    >
                      {row.isSaving ? "Saving..." : "Save"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceSmsSettings;
