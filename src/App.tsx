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
import AIModelCard from './components/AIModelCard';
import KnowledgeBasesCard from './components/KnowledgeBasesCard';
import DocumentsCard from './components/DocumentsCard';
import PromptLab from './components/PromptLab';
import OntologiesCard from './components/OntologiesCard';
import AIPlatformsCard from './components/AIPlatformsCard';
import ComingSoonCard from './components/ComingSoonCard';
import GoogleCloudConsoleDashboard from './components/GcpConsoleDashboardView';
import { FiGrid, FiShare2, FiBarChart2, FiBook, FiCommand, FiLayers, FiPlus, FiLink, FiInfo, FiAlertCircle, FiZap } from 'react-icons/fi';

const APP_NOTIFICATION_HISTORY_KEY = 'app_notification_history';

const App: React.FC = () => {
  const {
    merchants,
    selectedCluster,
    loading,
    error,
    viewMode,
    fetchMerchants,
    fetchClusters,
    addMerchant,
    updateMerchant,
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
  const modelStudioMerchantId = merchants[0]?.id;
  const modelStudioCluster = selectedCluster || merchants[0]?.cluster;
  const modelStudioFallback = (
    <ComingSoonCard
      title="No Merchant Selected"
      description="Select a merchant from the Merchants page to use Model Studio features."
      icon={<FiInfo size={48} />}
    />
  );

  useEffect(() => {
    const applyThemeFromSettings = () => {
      try {
        const raw = localStorage.getItem('admin_console_settings');
        const parsed = raw ? JSON.parse(raw) : null;
        const theme = parsed?.theme || 'System';
        const root = window.document.documentElement;
        if (theme === 'Dark') {
          root.classList.add('dark');
        } else if (theme === 'Light') {
          root.classList.remove('dark');
        } else {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', isDark);
        }
      } catch {
        window.document.documentElement.classList.remove('dark');
      }
    };

    applyThemeFromSettings();
    window.addEventListener('storage', applyThemeFromSettings);
    window.addEventListener('app-settings-updated', applyThemeFromSettings);
    return () => {
      window.removeEventListener('storage', applyThemeFromSettings);
      window.removeEventListener('app-settings-updated', applyThemeFromSettings);
    };
  }, []);

  // Notification helper functions
  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, type, title, message, duration: 5000 }]);
    try {
      const raw = localStorage.getItem(APP_NOTIFICATION_HISTORY_KEY);
      const prev = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(prev) ? prev : [];
      next.unshift({
        id,
        source: 'app',
        type,
        title,
        message,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(APP_NOTIFICATION_HISTORY_KEY, JSON.stringify(next.slice(0, 200)));
      window.dispatchEvent(new Event('app-notification'));
    } catch {
      // no-op for history persistence failure
    }
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
        <p className="text-gray-600 font-medium">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--neutral-bg)', color: 'var(--neutral-text-main)' }}>
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
                  x
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
                    onStatusUpdate={handleStatusUpdate}
                  />
                }
              />
              <Route path="/merchants/:id" element={<MerchantDetails />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/google-cloud-console" element={<GoogleCloudConsoleDashboard />} />

              {/* Model Studio Routes */}
              <Route path="/model-studio/models" element={modelStudioMerchantId ? <AIModelCard merchantId={modelStudioMerchantId} cluster={modelStudioCluster} initialTab="Model Management" /> : modelStudioFallback} />
              <Route path="/model-studio/ml-models" element={modelStudioMerchantId ? <AIModelCard merchantId={modelStudioMerchantId} cluster={modelStudioCluster} initialTab="ML Models" /> : modelStudioFallback} />
              <Route path="/model-studio/playground" element={modelStudioMerchantId ? <AIPlatformsCard merchantId={modelStudioMerchantId} cluster={modelStudioCluster} /> : modelStudioFallback} />

              <Route path="/model-studio/knowledge-base" element={modelStudioMerchantId ? <KnowledgeBasesCard merchantId={modelStudioMerchantId} cluster={modelStudioCluster} /> : modelStudioFallback} />
              <Route path="/model-studio/documents" element={modelStudioMerchantId ? <DocumentsCard merchantId={modelStudioMerchantId} cluster={modelStudioCluster} /> : modelStudioFallback} />
              <Route path="/model-studio/datasets" element={<ComingSoonCard title="Datasets" description="Manage large scale training data for your custom models." icon={<FiGrid size={48} />} />} />
              <Route path="/model-studio/knowledge-graph" element={<ComingSoonCard title="Knowledge Graph" description="Visualize and manage structured knowledge relationships." icon={<FiShare2 size={48} />} />} />

              <Route path="/model-studio/prompt-lab" element={modelStudioMerchantId ? <PromptLab merchantId={modelStudioMerchantId} cluster={modelStudioCluster} /> : modelStudioFallback} />
              <Route path="/model-studio/prompt-stats" element={<ComingSoonCard title="Prompt Stats" description="Analyze prompt performance and token usage metrics." icon={<FiBarChart2 size={48} />} />} />
              <Route path="/model-studio/ontology" element={modelStudioMerchantId ? <OntologiesCard merchantId={modelStudioMerchantId} cluster={modelStudioCluster} /> : modelStudioFallback} />
              <Route path="/model-studio/notebook" element={<ComingSoonCard title="Notebook" description="Interactive environment for model testing and data exploration." icon={<FiBook size={48} />} />} />

              <Route path="/model-studio/intents" element={<ComingSoonCard title="Intents" description="Define and manage natural language intent classification patterns." icon={<FiZap size={48} />} />} />
              <Route path="/model-studio/entities" element={<ComingSoonCard title="Entities" description="Define and manage named entity recognition patterns." icon={<FiLayers size={48} />} />} />
              <Route path="/model-studio/extensions" element={<ComingSoonCard title="Extensions" description="Configure third-party API extensions for your agents." icon={<FiPlus size={48} />} />} />
              <Route path="/model-studio/plugins" element={<ComingSoonCard title="Plugins" description="Manage custom plugins to extend platform functionality." icon={<FiLink size={48} />} />} />

              <Route path="/model-studio/business-faq" element={<ComingSoonCard title="Business FAQ" description="Manage standard business question and answer pairs." icon={<FiInfo size={48} />} />} />
              <Route path="/model-studio/unanswered" element={<ComingSoonCard title="Un Trained Utterances" description="Review and train unanswered messages from your users." icon={<FiAlertCircle size={48} />} />} />
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

