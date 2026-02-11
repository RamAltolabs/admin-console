import React from 'react';
import MerchantList from './MerchantList';
import { Merchant } from '../types/merchant';
import { useMerchantContext } from '../context/MerchantContext';
import { FiUsers, FiServer, FiGlobe, FiActivity, FiLayers } from 'react-icons/fi';

interface MerchantsProps {
  merchants: Merchant[];
  loading: boolean;
  onEdit: (merchant: Merchant) => void;
  onDelete: (merchant: Merchant) => void;
  onCreate: () => void;
  onSearch: (query: string) => void;
  onStatusUpdate: (merchantId: string, newStatus: 'Active' | 'Inactive') => void;
}

const Merchants: React.FC<MerchantsProps> = ({
  merchants,
  loading,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onStatusUpdate,
}) => {
  const { selectedCluster, viewMode, clusters, setSelectedCluster, setViewMode } = useMerchantContext();

  const getClusterIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case 'it-app': return <FiServer size={24} />;
      case 'app6a':
      case 'app6e':
      case 'app30a':
      case 'app30b': return <FiGlobe size={24} />;
      default: return <FiActivity size={24} />;
    }
  };

  const getClusterColorClass = (id: string) => {
    switch (id.toLowerCase()) {
      case 'it-app': return 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100';
      case 'app6a': return 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100';
      case 'app30a': return 'bg-amber-50 text-amber-600 group-hover:bg-amber-100';
      case 'app30b': return 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100';
      case 'app6e': return 'bg-violet-50 text-violet-600 group-hover:bg-violet-100';
      default: return 'bg-blue-50 text-blue-600 group-hover:bg-blue-100';
    }
  };

  // Show message if no cluster is selected and not in global view
  if (!selectedCluster && viewMode !== 'overall') {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-100px)] py-4 overflow-hidden">
        <div className="text-center bg-white rounded-xl border border-neutral-border p-6 md:p-8 max-w-2xl shadow-sm">
          <FiUsers className="mx-auto text-primary-main/20 mb-3" size={48} />
          <h2 className="text-lg font-bold text-neutral-text-main mb-1">Cluster Selection Required</h2>
          <p className="text-[13px] text-neutral-text-secondary leading-tight mb-4">
            Select a target cluster to initialize analytics.
          </p>

          {/* Cluster Selection Grid */}
          {clusters.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {/* All Clusters Option - Now as Global View Card */}
              <button
                onClick={() => {
                  setSelectedCluster('');
                  setViewMode('overall');
                }}
                className="group relative p-4 bg-white border border-neutral-border rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary-main/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary-main/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-12 h-12 bg-primary-main/10 rounded-xl flex items-center justify-center text-primary-main mb-3 group-hover:scale-110 transition-transform duration-300">
                    <FiLayers size={24} />
                  </div>
                  <span className="text-[13px] font-bold text-neutral-text-main group-hover:text-primary-main transition-colors">Global Overview</span>
                  <span className="text-[9px] text-neutral-text-muted mt-0.5 uppercase tracking-widest font-bold">All {clusters.length} Nodes</span>
                </div>
              </button>

              {clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  onClick={() => {
                    setSelectedCluster(cluster.id);
                    setViewMode('cluster');
                  }}
                  className="group relative p-4 bg-white border border-neutral-border rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary-main/30 overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 transform group-hover:-translate-y-1 ${getClusterColorClass(cluster.id)}`}>
                      {getClusterIcon(cluster.id)}
                    </div>
                    <span className="text-[13px] font-bold text-neutral-text-main group-hover:text-primary-main transition-colors uppercase tracking-tight">{cluster.name}</span>
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-[9px] text-neutral-text-muted font-bold opacity-60 uppercase">{cluster.region || 'Active Node'}</span>
                      {cluster.gcpProject && (
                        <span className="text-[10px] bg-primary-main/5 text-primary-main px-2 py-0.5 rounded-full mt-1.5 font-bold tracking-wider">{cluster.gcpProject.replace('GCP Project Name: ', '')}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-text-muted mt-4">No clusters available. Please contact your administrator.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto">
      <MerchantList
        merchants={merchants}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreate={onCreate}
        onSearch={onSearch}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
};

export default Merchants;
