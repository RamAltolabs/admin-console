import React, { createContext, useContext, useState, useCallback } from 'react';
import { Merchant, Cluster } from '../types/merchant';
import merchantService from '../services/merchantService';

// Define MerchantContextType explicitly
interface MerchantContextType {
  merchants: Merchant[];
  clusters: Cluster[];
  selectedCluster: string;
  loading: boolean;
  error: string | null;
  viewMode: 'overall' | 'cluster';
  setViewMode: (mode: 'overall' | 'cluster') => void;
  setSelectedCluster: (cluster: string) => void;
  fetchMerchants: () => Promise<void>;
  fetchClusters: () => Promise<void>;
  addMerchant: (merchant: Merchant) => void;
  updateMerchant: (merchant: Merchant) => void;
  removeMerchant: (id: string) => void;
  clearError: () => void;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overall' | 'cluster'>('cluster');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchants = useCallback(async () => {
    // If in overall mode, fetch from all clusters
    if (viewMode === 'overall') {
      if (clusters.length === 0) return;

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching all merchants for global view');
        const results = await Promise.allSettled(
          clusters.map(cluster => merchantService.getMerchants(cluster.id))
        );

        let allMerchants: Merchant[] = [];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            // Assign cluster ID to each merchant if not present
            const merchantsWithCluster = result.value.map((m: Merchant) => ({
              ...m,
              cluster: m.cluster || clusters[index].id
            }));
            allMerchants = [...allMerchants, ...merchantsWithCluster];
          }
        });

        console.log('Fetched all merchants:', allMerchants.length);
        setMerchants(allMerchants);
        if (allMerchants.length === 0) {
          setError('No Data Found');
        }
      } catch (err: any) {
        console.error('Error fetching all merchants:', err);
        setError('No Data Found');
        setMerchants([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Don't fetch if no cluster is selected and not in overall mode
    if (!selectedCluster) {
      setMerchants([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching merchants for cluster:', selectedCluster);
      const data = await merchantService.getMerchants(selectedCluster);
      console.log('Fetched merchants:', data);
      setMerchants(data);
      if (data.length === 0) {
        setError('No Data Found');
      }
    } catch (err: any) {
      console.error('Error fetching merchants:', err);
      setError('No Data Found');
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCluster, viewMode, clusters]);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await merchantService.getClusters();
      setClusters(data);
      // Don't auto-select first cluster - user must select manually
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clusters');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMerchant = useCallback((merchant: Merchant) => {
    setMerchants(prev => [merchant, ...prev]);
  }, []);

  const updateMerchant = useCallback((updatedMerchant: Merchant) => {
    setMerchants(prev =>
      prev.map(m => m.id === updatedMerchant.id ? updatedMerchant : m)
    );
  }, []);

  const removeMerchant = useCallback((id: string) => {
    setMerchants(prev => prev.filter(m => m.id !== id));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: MerchantContextType = {
    merchants,
    clusters,
    selectedCluster,
    viewMode,
    loading,
    error,
    setViewMode,
    setSelectedCluster,
    fetchMerchants,
    fetchClusters,
    addMerchant,
    updateMerchant,
    removeMerchant,
    clearError,
  };

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchantContext = (): MerchantContextType => {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchantContext must be used within MerchantProvider');
  }
  return context;
};
