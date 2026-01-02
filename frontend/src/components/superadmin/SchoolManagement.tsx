import React, { useState } from "react";
import SchoolList from "./SchoolList";
import SchoolForm from "./SchoolForm";
import SchoolDetails from "./SchoolDetails";
import { SchoolManagementProps, SchoolSummary } from "./types";

const SchoolManagement: React.FC<SchoolManagementProps> = ({ onUpdate }) => {
  const [selectedSchool, setSelectedSchool] = useState<SchoolSummary | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateSchool = () => {
    setSelectedSchool(null);
    setShowForm(true);
  };

  const handleEditSchool = (school: any) => {
    setSelectedSchool(school);
    setShowForm(true);
  };

  const handleViewSchool = (school: any) => {
    setSelectedSchool(school);
    setShowDetails(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSchool(null);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh in SchoolList
    onUpdate(); // Refresh the dashboard data
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedSchool(null);
  };

  const handleSaveSchool = (_school: any) => {
    // The form component handles the API call
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh in SchoolList
    onUpdate(); // Refresh the dashboard data
  };

  return (
    <>
      <SchoolList
        onCreateSchool={handleCreateSchool}
        onEditSchool={handleEditSchool}
        onViewSchool={handleViewSchool}
        refreshTrigger={refreshTrigger}
      />

      <SchoolForm
        school={selectedSchool as any}
        isOpen={showForm}
        onClose={handleFormClose}
        onSave={handleSaveSchool}
      />

      <SchoolDetails
        schoolId={selectedSchool?.id || null}
        isOpen={showDetails}
        onClose={handleDetailsClose}
        onEdit={handleEditSchool}
      />
    </>
  );
};

export default SchoolManagement;
