import React, { useState } from "react";
import AccountantList, { Accountant } from "./AccountantList";
import AccountantForm from "./AccountantForm";
import AccountantDetailView from "./AccountantDetailView";

const AccountantManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState<Accountant | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleCreateAccountant = () => {
    setSelectedAccountant(null);
    setShowForm(true);
  };

  const handleEditAccountant = (accountant: Accountant) => {
    setSelectedAccountant(accountant);
    setShowForm(true);
  };

  const handleViewAccountant = (accountant: Accountant) => {
    setSelectedAccountant(accountant);
    setShowDetail(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedAccountant(null);
  };

  const handleFormSuccess = () => {
    // The AccountantList will automatically refresh via its internal state
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedAccountant(null);
  };

  return (
    <div className="space-y-6">
      {/* Accountant List */}
      <AccountantList
        onCreateAccountant={handleCreateAccountant}
        onEditAccountant={handleEditAccountant}
        onViewAccountant={handleViewAccountant}
      />

      {/* Accountant Form Modal */}
      <AccountantForm
        accountant={selectedAccountant}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={handleFormSuccess}
      />

      {/* Detail View Modal */}
      {showDetail && selectedAccountant && (
        <AccountantDetailView
          accountant={selectedAccountant as any}
          onClose={handleCloseDetail}
          onEdit={(accountant) => {
            handleCloseDetail();
            handleEditAccountant(accountant as any);
          }}
        />
      )}
    </div>
  );
};

export default AccountantManagement;
