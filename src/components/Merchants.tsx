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
  onStatusUpdate: (merchantId: string, newStatus: 'Active' | 'Inactive') => void;
}

const Merchants: React.FC<MerchantsProps> = ({
  merchants,
  loading,
  onEdit,
  onDelete,
  onCreate,
  onStatusUpdate,
}) => {
  const { selectedCluster, viewMode, clusters, setSelectedCluster, setViewMode } = useMerchantContext();

  const getClusterIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case 'dev-instance':
      case 'app30a':
      case 'app30b':
      case 'app30d': return <FiGlobe size={24} />;
      default: return <FiActivity size={24} />;
    }
  };

  const getClusterColorClass = (id: string) => {
    switch (id.toLowerCase()) {
      case 'app30a': return 'bg-amber-50 text-amber-600 group-hover:bg-amber-100';
      case 'app30b': return 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100';
      case 'app30d': return 'bg-rose-50 text-rose-600 group-hover:bg-rose-100';
      case 'dev-instance': return 'bg-violet-50 text-violet-600 group-hover:bg-violet-100';
      default: return 'bg-blue-50 text-blue-600 group-hover:bg-blue-100';
    }
  };

  // Show message if no cluster is selected and not in global view
  if (!selectedCluster && viewMode !== 'overall') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="text-center bg-white rounded-2xl border border-neutral-border p-6 md:p-8 max-w-3xl shadow-sm">
          <FiUsers className="mx-auto text-primary-main/20 mb-4" size={42} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-widest uppercase mb-3">
            Merchants
          </div>
          <h2 className="text-xl font-bold text-neutral-text-main mb-1.5">Cluster Selection Required</h2>
          <p className="text-sm text-neutral-text-secondary leading-tight mb-6">
            Merchants requires a cluster selection to browse and manage accounts.
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
                className="group relative p-3.5 bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-emerald-200 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-700 mb-2.5 group-hover:scale-110 transition-transform duration-300">
                    <FiLayers size={20} />
                  </div>
                  <span className="text-[12px] font-bold text-neutral-text-main group-hover:text-emerald-700 transition-colors">Global View</span>
                  <span className="text-[9px] text-neutral-text-muted mt-0.5 titlecase tracking-widest font-bold opacity-60">
                    All {clusters.length} Nodes
                  </span>
                </div>
              </button>

              {clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  onClick={() => {
                    setSelectedCluster(cluster.id);
                    setViewMode('cluster');
                  }}
                  className="group relative p-3.5 bg-white border border-emerald-100 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-emerald-200 overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-all duration-300 transform group-hover:-translate-y-1 ${getClusterColorClass(cluster.id)} ring-1 ring-emerald-100/60`}>
                      {getClusterIcon(cluster.id)}
                    </div>
                    <span className="text-[12px] font-bold text-neutral-text-main group-hover:text-emerald-700 transition-colors titlecase tracking-tight">{cluster.name}</span>
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-[9px] text-neutral-text-muted font-bold opacity-60 titlecase">{cluster.region || 'Active Node'}</span>
                      {cluster.gcpProject && (
                        <span className="text-[10px] bg-primary-main/5 text-primary-main px-2 py-0.5 rounded-full mt-1.5 font-bold tracking-wider">{cluster.gcpProject}</span>
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
    <div className="p-3 md:p-5 lg:p-6 mx-auto">
      <MerchantList
        merchants={merchants}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreate={onCreate}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
};

export default Merchants;
