import React from 'react';
import { useMemo } from 'react';
import { useMerchantContext } from '../context/MerchantContext';
import { calculateDashboardStats, calculatePercentage, formatNumber } from '../utils/analytics';
import merchantService from '../services/merchantService';
import AnalyticsDashboard from './AnalyticsDashboard';
import { FiUsers, FiCheckCircle, FiXCircle, FiAlertCircle, FiTrendingUp, FiHelpCircle, FiActivity, FiLayout, FiRefreshCw, FiServer, FiGlobe, FiLayers } from 'react-icons/fi';

const Dashboard: React.FC = () => {
  const { merchants, loading, selectedCluster, clusters, setSelectedCluster, fetchMerchants, fetchClusters, viewMode, setViewMode } = useMerchantContext();
  const [allClusterMerchants, setAllClusterMerchants] = React.useState<Record<string, any[]>>({});
  const [loadingAllClusters, setLoadingAllClusters] = React.useState(false);
  const [userStats, setUserStats] = React.useState({ totalUsers: 0, activeUsers: 0, onlineUsers: 0, totalVisitors: 0, onlineVisitors: 0, loading: false });
  const [recentVisitors, setRecentVisitors] = React.useState<any[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [activeGlobalTab, setActiveGlobalTab] = React.useState<string>('');

  // Set initial global tab when clusters are loaded
  React.useEffect(() => {
    if (viewMode === 'overall' && clusters.length > 0 && !activeGlobalTab) {
      const defaultClusterId = process.env.DEFAULT_CLUSTER_ID || 'it-app';
      const defaultCluster = clusters.find(c => c.id === defaultClusterId);
      setActiveGlobalTab(defaultCluster ? defaultCluster.id : clusters[0].id);
    }
  }, [viewMode, clusters, activeGlobalTab]);

  const handleManualRefresh = async () => {
    setRefreshKey(prev => prev + 1);
    setLastUpdated(new Date());
    // Also trigger refreshes in the context
    if (selectedCluster) {
      await fetchMerchants();
    }
    await fetchClusters();
  };

  // Auto-refresh logic
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        handleManualRefresh();
      }, 60000); // 60 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  // Aggregation logic for user & visitor stats using cluster-wide APIs
  React.useEffect(() => {
    const fetchDataStats = async () => {
      // Determine which clusters to fetch data for
      let targetClusters: string[] = [];

      if (viewMode === 'overall') {
        targetClusters = clusters.map(c => c.id);
      } else if (selectedCluster) {
        targetClusters = [selectedCluster];
      }

      if (targetClusters.length === 0) {
        setUserStats(prev => ({ ...prev, totalUsers: 0, activeUsers: 0, onlineUsers: 0, totalVisitors: 0, onlineVisitors: 0, loading: false }));
        setRecentVisitors([]);
        return;
      }

      setUserStats(prev => ({ ...prev, loading: true }));

      let totalAcc = 0;
      let activeU = 0;
      let onlineUsersCount = 0;
      let totalV = 0;
      let onlineV = 0;
      let combinedVisitors: any[] = [];

      try {
        const results = await Promise.all(
          targetClusters.map(async (clusterId) => {
            try {
              const [users, visitorsResponse] = await Promise.all([
                merchantService.getClusterUsers(clusterId),
                merchantService.getClusterVisitors(0, 100, clusterId) // Fetch more to ensure we get recent ones
              ]);

              return {
                clusterId,
                users: users || [],
                totalVisitors: visitorsResponse?.totalElements || 0,
                visitors: visitorsResponse?.content || []
              };
            } catch (err) {
              console.error(`Failed to fetch data for cluster ${clusterId}:`, err);
              return { clusterId, users: [], totalVisitors: 0, visitors: [] };
            }
          })
        );

        results.forEach(res => {
          totalAcc += res.users.length;
          activeU += res.users.filter(u => u.status?.toLowerCase() === 'active').length;
          onlineUsersCount += res.users.filter(u => u.available === true).length;
          totalV += res.totalVisitors;

          // Calculate online visitors (active in last 30 minutes for better visibility)
          const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
          onlineV += res.visitors.filter((v: any) => {
            const d = v.visitedAt || v.lastAccessedDate_dt || v.createTime || v.lastAccessedDate || v.lastModifiedDate;
            if (!d) return false;

            // Robust parsing for common API formats (e.g., handles DD-MM-YYYY or MM/DD/YYYY)
            let timestamp: number;
            if (typeof d === 'string' && d.includes('-') && d.split('-')[0].length === 2) {
              // Try to fix DD-MM-YYYY to MM-DD-YYYY or YYYY-MM-DD for JS Date
              const parts = d.split(' ');
              const dateParts = parts[0].split('-');
              const fixedDate = `${dateParts[1]}-${dateParts[0]}-${dateParts[2]}${parts[1] ? ' ' + parts[1] : ''}`;
              timestamp = new Date(fixedDate).getTime();
            } else {
              timestamp = new Date(d).getTime();
            }

            return !isNaN(timestamp) && timestamp > thirtyMinutesAgo;
          }).length;

          // Map visitors to include merchant name and cluster info
          const clusterMerchants = allClusterMerchants[res.clusterId] || (selectedCluster === res.clusterId ? merchants : []);
          const mappedVisitors = res.visitors.map((v: any) => ({
            ...v,
            cluster: res.clusterId,
            merchantName: v.merchantName || clusterMerchants.find(m => m.id === v.merchantID || m.id === v.merchantId)?.name || (v.merchantID || v.merchantId || `Visitor.${Math.floor(Math.random() * 10000)}`)
          }));

          combinedVisitors = [...combinedVisitors, ...mappedVisitors];
        });

        // Sort combined visitors by time (latest first) and take top 10
        const sortedVisitors = combinedVisitors.sort((a, b) => {
          const parseDate = (v: any) => {
            const d = v.visitedAt || v.lastAccessedDate_dt || v.createTime || v.lastAccessedDate || v.lastModifiedDate || 0;
            if (typeof d === 'number') return d;
            if (!d) return 0;

            // Robust parsing for common API formats
            let timestamp: number;
            if (typeof d === 'string' && d.includes('-') && d.split('-')[0].length === 2) {
              const parts = d.split(' ');
              const dateParts = parts[0].split('-');
              const fixedDate = `${dateParts[1]}-${dateParts[0]}-${dateParts[2]}${parts[1] ? ' ' + parts[1] : ''}`;
              timestamp = new Date(fixedDate).getTime();
            } else {
              timestamp = new Date(d).getTime();
            }

            return !isNaN(timestamp) ? timestamp : 0;
          };
          return parseDate(b) - parseDate(a);
        }).slice(0, 10);

        setUserStats({
          totalUsers: totalAcc,
          activeUsers: activeU,
          onlineUsers: onlineUsersCount,
          totalVisitors: totalV,
          onlineVisitors: onlineV,
          loading: false
        });
        setRecentVisitors(sortedVisitors);
      } catch (err) {
        console.error('Error aggregating cluster stats:', err);
        setUserStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDataStats();
  }, [selectedCluster, viewMode, clusters, merchants, allClusterMerchants, refreshKey]);

  // Fetch merchants from all clusters for overall view
  React.useEffect(() => {
    const fetchAllClusters = async () => {
      if (viewMode === 'overall' && clusters.length > 0) {
        setLoadingAllClusters(true);
        try {
          const merchantsByCluster: Record<string, any[]> = {};
          await Promise.all(
            clusters.map(async (cluster) => {
              try {
                // Use cluster.id for the API call as it's the unique identifier
                const data = await merchantService.getMerchants(cluster.id);
                merchantsByCluster[cluster.id] = Array.isArray(data) ? data : [];
              } catch (err) {
                console.error(`Failed to fetch merchants for cluster ${cluster.id}:`, err);
                merchantsByCluster[cluster.id] = [];
              }
            })
          );
          setAllClusterMerchants(merchantsByCluster);
        } catch (err) {
          console.error('Error fetching all clusters:', err);
        } finally {
          setLoadingAllClusters(false);
        }
      }
    };
    fetchAllClusters();
  }, [viewMode, clusters, refreshKey]);

  // Ensure view mode stays in 'cluster' if initiated that way, 
  // but allow auto-switching to cluster when a selection is made
  React.useEffect(() => {
    if (selectedCluster) {
      setViewMode('cluster');
    }
  }, [selectedCluster]);

  const stats = useMemo(() => {
    if (viewMode === 'overall') {
      // Aggregate stats across all clusters
      const allMerchants = Object.values(allClusterMerchants).flat();
      console.log('Dashboard - Calculating overall stats for', allMerchants.length, 'merchants across all clusters');
      const result = calculateDashboardStats(allMerchants);
      console.log('Dashboard - Overall stats result:', result);
      return result;
    } else {
      // Single cluster stats
      console.log('Dashboard - Calculating stats for', merchants.length, 'merchants');
      const result = calculateDashboardStats(merchants);
      console.log('Dashboard - Stats result:', result);
      return result;
    }
  }, [viewMode, merchants, allClusterMerchants]);

  // Calculate cluster breakdown for overall view
  const clusterBreakdown = useMemo(() => {
    if (viewMode === 'overall') {
      return Object.entries(allClusterMerchants).map(([clusterId, merchants]) => {
        const cluster = clusters.find(c => c.id === clusterId);
        return {
          name: cluster?.name || clusterId,
          count: merchants.length,
          active: merchants.filter(m => m.status?.toLowerCase() === 'active').length,
          inactive: merchants.filter(m => m.status?.toLowerCase() === 'inactive').length,
        };
      });
    }
    return [];
  }, [viewMode, allClusterMerchants, clusters]);

  // Show message if no cluster is selected AND in cluster mode
  if (!selectedCluster && viewMode === 'cluster') {
    return (
      <div className="flex items-center justify-center h-full max-h-full overflow-hidden py-4">
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
                  <span className="text-[9px] text-neutral-text-muted mt-0.5 uppercase tracking-widest font-bold">All 5 Nodes</span>
                </div>
              </button>

              {clusters.map((cluster) => {
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

                return (
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
                          <span className="text-[10px] bg-primary-main/5 text-primary-main px-2 py-0.5 rounded-full mt-1.5 font-bold tracking-wider">{cluster.gcpProject}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-text-muted mt-4">No clusters available. Please contact your administrator.</p>
          )}
        </div>
      </div>
    );
  }

  const isLoading = viewMode === 'overall' ? loadingAllClusters : loading;
  const hasMerchants = viewMode === 'overall'
    ? Object.values(allClusterMerchants).flat().length > 0
    : merchants.length > 0;

  if (isLoading && !hasMerchants) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-main border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xs font-bold text-neutral-text-muted uppercase tracking-widest">Initializing Datastream...</p>
        </div>
      </div>
    );
  }

  // Show message if no merchants
  if (!isLoading && !hasMerchants) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-text-main">System Dashboard</h1>
          <p className="text-sm text-neutral-text-secondary mt-1">
            Operational overview for {selectedCluster}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-border p-16 text-center shadow-sm">
          <FiUsers className="mx-auto text-neutral-border mb-6" size={64} />
          <h2 className="text-lg font-bold text-neutral-text-main mb-2">No Records Detected</h2>
          <p className="text-sm text-neutral-text-muted">
            The selected cluster currently contains no merchant records for this environment.
          </p>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    percentage?: number;
    trend?: number;
    refreshing?: boolean;
  }> = ({ title, value, icon, color, percentage, trend, refreshing }) => (
    <div className="card-premium p-4 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md hover:border-primary-main/30 group">
      <div className="flex items-center justify-between mb-3">
        <div
          className="p-2 rounded-xl transition-colors duration-300 relative"
          style={{
            backgroundColor: `${color}10`,
            color: color
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { size: 16 })}
          {refreshing && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-neutral-border/50">
              <FiRefreshCw size={8} className="animate-spin text-primary-main" />
            </div>
          )}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[9px] font-bold text-neutral-text-muted uppercase tracking-[0.1em] mb-1 group-hover:text-neutral-text-secondary transition-colors">{title}</p>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold text-neutral-text-main tracking-tight leading-none">
            {refreshing ? (
              <span className="inline-block w-12 h-6 bg-neutral-bg animate-pulse rounded"></span>
            ) : (
              formatNumber(value)
            )}
          </p>
          {percentage !== undefined && !refreshing && (
            <span className="text-[10px] font-bold text-neutral-text-secondary pb-0.5">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-6 pb-20">
      {/* Executive Header Tile */}
      <div className="bg-white rounded-2xl border border-neutral-border shadow-sm overflow-hidden mb-2">
        <div className="bg-gradient-to-r from-primary-main/5 via-transparent to-transparent px-6 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl border border-neutral-border shadow-sm flex items-center justify-center text-primary-main shrink-0">
              <FiActivity size={24} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-neutral-text-main tracking-tight leading-tight">Executive Dashboard</h1>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-green-50 text-green-600 rounded-md border border-green-100/50 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Live Fetching</span>
                  </div>

                  <div className="flex items-center gap-2 px-2 py-0.5 bg-neutral-bg text-neutral-text-muted rounded-md border border-neutral-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Updated {Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000)}m ago
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`flex items-center gap-2 px-2 py-0.5 rounded-md border transition-all ${autoRefresh
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white border-neutral-border text-neutral-text-muted hover:border-primary-main/30'
                        }`}
                    >
                      <div className={`w-1 h-1 rounded-full ${autoRefresh ? 'bg-white animate-pulse' : 'bg-neutral-border'}`}></div>
                      <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">Sync: {autoRefresh ? 'ON' : 'OFF'}</span>
                    </button>
                    <button
                      onClick={handleManualRefresh}
                      className="p-1 bg-white text-neutral-text-main border border-neutral-border rounded-md hover:text-primary-main hover:border-primary-main/30 transition-all shadow-sm group/refresh"
                      title="Force Refresh Data"
                      disabled={isLoading || userStats.loading}
                    >
                      <FiRefreshCw size={11} className={`transition-transform duration-500 ${isLoading || userStats.loading ? 'animate-spin' : 'group-active/refresh:rotate-180'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Infrastructure & Context Row */}
              <div className="flex flex-wrap items-center gap-x-3 text-[11px] font-medium text-neutral-text-secondary bg-neutral-bg/30 px-3 py-1.5 rounded-lg border border-neutral-border/30 w-fit">
                <div className="flex items-center gap-2">
                  <FiLayout size={13} className="text-primary-main/70" />
                  <span className="font-semibold">Viewing Cluster:</span>
                  <span className="text-[#0052cc] font-black tracking-wide bg-white px-2 py-0.5 rounded border border-[#0052cc]/10">
                    {viewMode === 'overall' ? 'GLOBAL OVERVIEW' : `#${selectedCluster}`}
                  </span>
                </div>

                {viewMode === 'cluster' && selectedCluster && (
                  <>
                    <div className="h-3 w-[1px] bg-neutral-border mx-1" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-text-secondary uppercase tracking-[0.05em]">GCP Info:</span>
                      <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded border border-neutral-border/50">
                        <span className="text-neutral-text-main font-black uppercase tracking-tight">
                          {clusters.find(c => c.id === selectedCluster)?.region}
                        </span>
                        <span className="text-neutral-border font-light">|</span>
                        <span className="text-primary-main font-bold uppercase tracking-tighter">
                          {clusters.find(c => c.id === selectedCluster)?.gcpProject?.replace('GCP Project Name: ', '')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Summary Metadata */}
            <div className="hidden xl:flex items-center gap-6 mr-4 pr-6 border-r border-neutral-border">
              <div className="text-center">
                <p className="text-[10px] font-bold text-neutral-text-muted uppercase tracking-widest">Active Merchants</p>
                <p className="text-lg font-bold text-neutral-text-main leading-none mt-1">{stats.activeMerchants}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-neutral-text-muted uppercase tracking-widest">Online Agents</p>
                <p className="text-lg font-bold text-neutral-text-main leading-none mt-1">{userStats.onlineUsers}</p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-neutral-bg/50 rounded-xl border border-neutral-border p-1 flex items-center shadow-inner">
              <button
                onClick={() => setViewMode('cluster')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'cluster'
                  ? 'bg-white text-primary-main shadow-sm'
                  : 'text-neutral-text-secondary hover:text-primary-main'
                  }`}
              >
                Cluster Focus View
              </button>
              <button
                onClick={() => setViewMode('overall')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'overall'
                  ? 'bg-white text-primary-main shadow-sm'
                  : 'text-neutral-text-secondary hover:text-primary-main'
                  }`}
              >
                Global View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid: Integrated Business & Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <StatCard
          title="Total Merchants"
          value={stats.totalMerchants}
          icon={<FiUsers />}
          color="#0052cc"
          trend={12}
          refreshing={isLoading}
        />
        <StatCard
          title="Active"
          value={stats.activeMerchants}
          icon={<FiCheckCircle />}
          color="#36b37e"
          percentage={calculatePercentage(stats.activeMerchants, stats.totalMerchants)}
          trend={5}
          refreshing={isLoading}
        />
        <StatCard
          title="Inactive"
          value={stats.inactiveMerchants}
          icon={<FiXCircle />}
          color="#ff5630"
          percentage={calculatePercentage(stats.inactiveMerchants, stats.totalMerchants)}
          trend={-2}
          refreshing={isLoading}
        />
        <StatCard
          title="Unknown"
          value={stats.unknownMerchants}
          icon={<FiHelpCircle />}
          color="#ffab00"
          percentage={calculatePercentage(stats.unknownMerchants, stats.totalMerchants)}
          refreshing={isLoading}
        />
        {/* <StatCard
          title="Total Agents"
          value={userStats.totalUsers}
          icon={<FiUsers />}
          color="#42526e"
          trend={8}
          refreshing={userStats.loading}
        /> */}
        <StatCard
          title="Active Agents"
          value={userStats.activeUsers}
          icon={<FiTrendingUp />}
          color="#0052cc"
          percentage={userStats.totalUsers > 0 ? calculatePercentage(userStats.activeUsers, userStats.totalUsers) : 0}
          trend={15}
          refreshing={userStats.loading}
        />
        <StatCard
          title="Online Agents Now"
          value={userStats.onlineUsers}
          icon={<FiActivity />}
          color="#36b37e"
          trend={3}
          refreshing={userStats.loading}
        />
        <StatCard
          title="Online Visitors"
          value={userStats.onlineVisitors}
          icon={<FiActivity />}
          color="#ff7452"
          trend={12}
          refreshing={userStats.loading}
        />
        <StatCard
          title="Total Visitors"
          value={userStats.totalVisitors}
          icon={<FiActivity />}
          color="#ffab00"
          trend={22}
          refreshing={userStats.loading}
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Merchants Table */}
        <div className="card-premium overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-neutral-border flex items-center justify-between bg-neutral-bg/20">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-main"></div>
              <h2 className="text-sm font-bold text-neutral-text-main uppercase tracking-widest">Recent Merchants</h2>
            </div>
            {isLoading && <div className="animate-spin h-4 w-4 border-2 border-primary-main border-t-transparent rounded-full"></div>}
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-border">
              <thead className="bg-neutral-bg/30">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">Merchant Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">Email Address</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-border">
                {stats.recentMerchants.slice(0, 10).map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-neutral-bg/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-neutral-text-main group-hover:text-primary-main">{merchant.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-neutral-text-secondary">{merchant.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${merchant.status?.toLowerCase() === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                        {merchant.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Visitors Table */}
        <div className="card-premium overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-neutral-border flex items-center justify-between bg-neutral-bg/20">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#36b37e]"></div>
              <h2 className="text-sm font-bold text-neutral-text-main uppercase tracking-widest">Recent Visitors</h2>
            </div>
            {userStats.loading && <div className="animate-spin h-4 w-4 border-2 border-[#36b37e] border-t-transparent rounded-full"></div>}
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-border">
              <thead className="bg-neutral-bg/30">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">Visitor Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">Merchant ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">Engagement</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-text-muted uppercase tracking-[0.2em]">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-border">
                {recentVisitors.length > 0 ? (
                  recentVisitors.map((visitor, idx) => (
                    <tr key={`${visitor.id}-${idx}`} className="hover:bg-neutral-bg/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-neutral-text-main">
                          {(() => {
                            const contacts = visitor.contacts || visitor.contact;
                            let fn = '';
                            let ln = '';
                            if (contacts) {
                              const c = Array.isArray(contacts) ? contacts[0] : contacts;
                              fn = c?.firstName || c?.first_name || c?.FirstName || '';
                              ln = c?.lastName || c?.last_name || c?.LastName || '';
                              if (!fn && !ln) {
                                const cn = c?.name || c?.fullName || c?.full_name || '';
                                if (cn) return cn;
                              }
                            }
                            fn = fn || visitor.firstName || visitor.first_name || visitor.FirstName || '';
                            ln = ln || visitor.lastName || visitor.last_name || visitor.LastName || '';
                            const fullName = `${fn} ${ln}`.trim();
                            if (fullName) return fullName;
                            if (visitor.visitorName || visitor.name) return visitor.visitorName || visitor.name;
                            const idStr = visitor.id || visitor.visitorId || '';
                            const parts = idStr.split('-');
                            const prefix = parts.length > 1 ? parts[0] : idStr.substring(0, 8);
                            return `visitor.${prefix || 'Unknown'}`;
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-[9px] font-bold">
                            {visitor.cluster?.substring(0, 1).toUpperCase()}
                          </div>
                          <span className="text-[10px] font-mono text-neutral-text-main font-bold">
                            {visitor.merchantID || visitor.merchantId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-neutral-text-secondary">
                          {(() => {
                            const engagements = visitor.engagements || [];
                            const e = Array.isArray(engagements) ? engagements[0] : engagements;
                            return e?.engagementName || visitor.engagementName || 'N/A';
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-neutral-text-main">
                            {(() => {
                              const d = new Date(visitor.visitedAt || visitor.lastAccessedDate_dt || visitor.createTime || visitor.lastAccessedDate || visitor.lastModifiedDate);
                              return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
                            })()}
                          </span>
                          <span className="text-[9px] font-bold text-neutral-text-muted uppercase">
                            {(() => {
                              const d = new Date(visitor.visitedAt || visitor.lastAccessedDate_dt || visitor.createTime || visitor.lastAccessedDate || visitor.lastModifiedDate);
                              return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-xs font-medium text-neutral-text-muted">
                      {userStats.loading ? 'Gathering visitor data...' : 'No recent visitors detected.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewMode === 'overall' ? (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card-premium overflow-hidden bg-white shadow-sm border border-neutral-border/50">
            {/* Unified Visual Cluster Navigation */}
            <div className="px-6 py-4 border-b border-neutral-border bg-neutral-bg/10 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-3">
                {clusters.map((cluster) => {
                  const isActive = activeGlobalTab === cluster.id;
                  return (
                    <button
                      key={cluster.id}
                      onClick={() => setActiveGlobalTab(cluster.id)}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all min-w-[240px] text-left shrink-0 ${isActive
                        ? 'bg-white border-primary-main shadow-md ring-1 ring-primary-main/10 translate-y-[-2px]'
                        : 'bg-white/50 border-neutral-border/50 text-neutral-text-muted hover:bg-white hover:border-primary-main/30'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner transition-all ${isActive ? 'bg-[#0052cc] text-white rotate-0' : 'bg-neutral-bg text-neutral-text-muted -rotate-3'
                        }`}>
                        {cluster.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold leading-tight ${isActive ? 'text-neutral-text-main' : 'text-neutral-text-secondary'}`}>
                          {cluster.name} Analytics
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                            {cluster.region}
                          </span>
                          <span className="text-neutral-border text-[9px]">|</span>
                          <span className={`text-[9px] font-bold uppercase tracking-tighter ${isActive ? 'text-primary-main' : 'opacity-40'}`}>
                            {cluster.gcpProject?.replace('GCP Project Name: ', '')}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-0">
              <AnalyticsDashboard key={activeGlobalTab} cluster={activeGlobalTab} />
            </div>
          </div>
        </div>
      ) : (
        selectedCluster && (
          <div className="mt-8">
            <AnalyticsDashboard key={selectedCluster} cluster={selectedCluster} />
          </div>
        )
      )}
    </div>
  );
};

export default Dashboard;
