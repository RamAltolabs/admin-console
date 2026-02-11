import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Merchants from './components/Merchants';
import MerchantDetails from './components/MerchantDetails';
import MerchantFormModal from './components/MerchantFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import NotificationContainer from './components/NotificationContainer';
import { useMerchantContext } from './context/MerchantContext';
import merchantService from './services/merchantService';
import { CreateMerchantPayload, UpdateMerchantPayload, Merchant } from './types/merchant';
import { NotificationProps } from './components/Notification';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Settings from './components/Settings';

const App: React.FC = () => {
  const {
    merchants,
    selectedCluster,
    loading,
    error,
    viewMode,
    setViewMode,
    fetchMerchants,
    fetchClusters,
    addMerchant,
    updateMerchant,
    removeMerchant,
    clearError,
  } = useMerchantContext();

  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(() => {
    return localStorage.getItem('sidebar_minimized') === 'true';
  });

  const toggleSidebarMinimize = () => {
    const newState = !sidebarMinimized;
    setSidebarMinimized(newState);
    localStorage.setItem('sidebar_minimized', String(newState));
  };

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notifications, setNotifications] = useState<Omit<NotificationProps, 'onClose'>[]>([]);

  // Notification helper functions
  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, type, title, message, duration: 5000 }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Initialize
  useEffect(() => {
    fetchClusters();
  }, []);

  // Fetch merchants when cluster or view mode changes
  useEffect(() => {
    if (selectedCluster || viewMode === 'overall') {
      fetchMerchants();
    }
  }, [selectedCluster, viewMode, fetchMerchants]);

  // Handle form submission
  const handleFormSubmit = async (data: CreateMerchantPayload | UpdateMerchantPayload) => {
    setFormLoading(true);
    try {
      if (selectedMerchant) {
        // Update existing merchant
        const updatedMerchant = await merchantService.updateMerchant(
          selectedMerchant.id,
          data as UpdateMerchantPayload
        );
        updateMerchant(updatedMerchant);
        addNotification('success', 'Merchant Updated', `${updatedMerchant.name} has been updated successfully.`);
      } else {
        // Create new merchant
        const newMerchant = await merchantService.createMerchant(data as CreateMerchantPayload);
        addMerchant(newMerchant);
        addNotification('success', 'Merchant Created', `${newMerchant.name} has been created successfully.`);
      }
      setSelectedMerchant(undefined);
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Form submission error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Operation failed';
      addNotification('error', 'Operation Failed', errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    // TEMPORARILY DISABLED: Delete merchant is restricted for the time being.
    addNotification('warning', 'Action Restricted', 'Delete Merchant functionality is currently disabled.');
    return;

    /* Original Logic 
    if (!selectedMerchant) return;

    const merchantName = selectedMerchant.name;
    setDeleteLoading(true);
    try {
      await merchantService.deleteMerchant(selectedMerchant.id);
      removeMerchant(selectedMerchant.id);
      setIsDeleteModalOpen(false);
      setSelectedMerchant(undefined);
      addNotification('success', 'Merchant Deleted', `${merchantName} has been deleted successfully.`);
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete merchant';
      addNotification('error', 'Delete Failed', errorMessage);
    } finally {
      setDeleteLoading(false);
    }
    */
  };

  const handleEdit = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setIsFormModalOpen(true);
  };

  const handleDelete2 = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedMerchant(undefined);
    setIsFormModalOpen(true);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchMerchants();
      return;
    }
    try {
      await merchantService.searchMerchants(query, undefined, selectedCluster);
      // This would need state management to handle search results
      // For now, we'll rely on the backend filtering
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleStatusUpdate = async (merchantId: string, newStatus: 'Active' | 'Inactive') => {
    try {
      const response = await merchantService.updateMerchantStatus(merchantId, newStatus);

      // Find the existing merchant to preserve all fields
      const existingMerchant = merchants.find(m => m.id === merchantId);

      if (existingMerchant) {
        // Merge the response with existing merchant data
        const updatedMerchant: Merchant = {
          ...existingMerchant,
          ...response,
          status: newStatus.toLowerCase() as 'active' | 'inactive' | 'suspended', // Convert to lowercase
        };
        updateMerchant(updatedMerchant);
      }

      addNotification('success', 'Status Updated', `Merchant status changed to ${newStatus}.`);
    } catch (err: any) {
      console.error('Status update error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update merchant status';
      addNotification('error', 'Status Update Failed', errorMessage);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-genx-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium italic">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Notifications */}
        <NotificationContainer notifications={notifications} onClose={removeNotification} />

        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isMinimized={sidebarMinimized}
            onToggleMinimize={toggleSidebarMinimize}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-auto transition-all duration-300">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 mx-6 mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="text-red-700 hover:text-red-900 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Routes */}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/merchants"
                element={
                  <Merchants
                    merchants={merchants}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete2}
                    onCreate={handleCreate}
                    onSearch={handleSearch}
                    onStatusUpdate={handleStatusUpdate}
                  />
                }
              />
              <Route path="/merchants/:id" element={<MerchantDetails />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>

        {/* Modals */}
        <MerchantFormModal
          isOpen={isFormModalOpen}
          merchant={selectedMerchant}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedMerchant(undefined);
          }}
          onSubmit={handleFormSubmit}
          onDelete={(m) => {
            setIsFormModalOpen(false);
            handleDelete2(m);
          }}
          loading={formLoading}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          merchantName={selectedMerchant?.name || ''}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedMerchant(undefined);
          }}
          loading={deleteLoading}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
