import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiSearch, FiPlus, FiFilter, FiFileText, FiChevronDown, FiChevronUp, FiEye, FiServer } from 'react-icons/fi';
import { Merchant } from '../types/merchant';
import { useMerchantContext } from '../context/MerchantContext';
import merchantService from '../services/merchantService';

interface MerchantListProps {
  merchants: Merchant[];
  loading: boolean;
  onEdit: (merchant: Merchant) => void;
  onDelete: (merchant: Merchant) => void;
  onCreate: () => void;
  onSearch?: (query: string) => void;
  onStatusUpdate: (merchantId: string, newStatus: 'Active' | 'Inactive') => void;
}

const MerchantList: React.FC<MerchantListProps> = ({
  merchants,
  loading,
  onEdit,
  onDelete,
  onCreate,
  onStatusUpdate,
}) => {
  const { selectedCluster, viewMode, clusters } = useMerchantContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paginatedMerchants, setPaginatedMerchants] = useState<Merchant[]>([]); // Added state for paginated merchants
  const [isSearchMode, setIsSearchMode] = useState(false); // Track if we're in search mode
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Status filter state
  const [clusterFilter, setClusterFilter] = useState<string>('all'); // Cluster filter state


  // Get unique status values from merchants
  const uniqueStatuses = React.useMemo(() => {
    const statusSet = new Set<string>();
    merchants.forEach(m => {
      if (m.status) {
        statusSet.add(m.status);
      } else {
        statusSet.add('Unknown');
      }
    });
    return Array.from(statusSet).sort();
  }, [merchants]);

  // Calculate filtered merchants based on status and cluster filter
  const filteredMerchants = React.useMemo(() => {
    return merchants.filter(m => {
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'Unknown' ? (!m.status || m.status.toLowerCase() === 'unknown') : m.status === statusFilter);
      const matchesCluster = clusterFilter === 'all' || m.cluster === clusterFilter;
      return matchesStatus && matchesCluster;
    });
  }, [merchants, statusFilter, clusterFilter]);

  React.useEffect(() => {
    // Update paginated merchants when page changes or merchants change (only when not in search mode)
    if (!isSearchMode) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPaginatedMerchants(filteredMerchants.slice(startIndex, endIndex));
    }
  }, [currentPage, filteredMerchants, isSearchMode, itemsPerPage]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();
    setSearchQuery(query);

    if (!query) {
      // If no search query, exit search mode and reset to page 1
      setIsSearchMode(false);
      setCurrentPage(1);
      return;
    }

    // Enter search mode and reset to page 1
    setIsSearchMode(true);
    setCurrentPage(1);

    // Client-side search across multiple fields
    const searchLower = query.toLowerCase();

    const searchResults = filteredMerchants.filter(merchant => {
      // Search in multiple fields
      const nameMatch = merchant.name?.toLowerCase().includes(searchLower);
      const emailMatch = merchant.email?.toLowerCase().includes(searchLower);
      const idMatch = merchant.id?.toLowerCase().includes(searchLower);
      const phoneMatch = merchant.phone?.toLowerCase().includes(searchLower);
      const addressMatch = merchant.address?.toLowerCase().includes(searchLower);
      const cityMatch = merchant.city?.toLowerCase().includes(searchLower);
      const stateMatch = merchant.state?.toLowerCase().includes(searchLower);
      const businessTypeMatch = merchant.businessType?.toLowerCase().includes(searchLower);
      const clusterMatch = merchant.cluster?.toLowerCase().includes(searchLower);

      return nameMatch || emailMatch || idMatch || phoneMatch ||
        addressMatch || cityMatch || stateMatch || businessTypeMatch || clusterMatch;
    });

    setPaginatedMerchants(searchResults);
  };

  const searchHint = 'Search by name, email, ID, phone, address, or business type...'; // Updated hint for search functionality

  // Format date: MMM DD, YYYY HH:mm
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  const totalPages = isSearchMode ? 1 : Math.ceil(filteredMerchants.length / itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-card-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-2xl font-semibold text-genx-700">
            {viewMode === 'overall' ? 'Global Merchants' : 'Merchants'}
          </h2>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 bg-genx-500 text-white px-4 py-2 rounded-lg hover:opacity-95 transition"
          >
            <FiPlus size={18} />
            <span className="font-medium">Create New Merchant</span>
          </button>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={searchHint} // Updated placeholder to include hint
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* 1. Changed gap-2 to relative and removed items-center from wrapper */}
          <div className="relative flex items-center">
            {/* 2. Added absolute positioning and pointer-events-none to the icon */}
            <FiFilter className="absolute left-3 text-gray-400 pointer-events-none z-10" size={18} />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              /* 3. Added pl-10 (Padding Left) to make room for the icon and appearance-none */
              className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg text-gray-700 cursor-pointer"  >
              <option value="all">All Status</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status === 'Unknown' ? 'Unknown' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            {/* 4. Added a custom chevron because appearance-none removes the default arrow */}
            <div className="absolute right-3 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Cluster Filter - Only show in Overall mode */}
          {viewMode === 'overall' && (
            <div className="relative flex items-center min-w-[200px]">
              <FiServer className="absolute left-3 text-gray-400 pointer-events-none z-10" size={18} />
              <select
                value={clusterFilter}
                onChange={(e) => {
                  setClusterFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg text-gray-700 cursor-pointer"
              >
                <option value="all">All Clusters</option>
                {clusters.map(cluster => (
                  <option key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Indicator */}
      {isSearchMode && searchQuery && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiSearch className="text-blue-600" size={16} />
              <span className="text-sm text-blue-900">
                Found <span className="font-bold">{paginatedMerchants.length}</span> result{paginatedMerchants.length !== 1 ? 's' : ''} for "{searchQuery}"
              </span>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchMode(false);
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Clear Search
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
            </div>
            <p className="mt-4 text-gray-600">Loading merchants...</p>
          </div>
        ) : paginatedMerchants.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p className="text-lg font-semibold">No Records Found</p> {/* Updated message */}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-genx-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  {viewMode === 'overall' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cluster</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMerchants.map((merchant, index) => (
                  <MerchantRow
                    key={merchant.id || `merchant-${index}`}
                    merchant={merchant}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusUpdate={onStatusUpdate}
                    formatDate={formatDate}
                    selectedCluster={selectedCluster}
                    viewMode={viewMode}
                  />
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center p-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSearchMode}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={filteredMerchants.length}>All ({filteredMerchants.length})</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isSearchMode}
                  className="px-4 py-2 bg-genx-500 text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isSearchMode}
                  className="px-4 py-2 bg-genx-500 text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface MerchantRowProps {
  merchant: Merchant;
  onEdit: (merchant: Merchant) => void;
  onDelete: (merchant: Merchant) => void;
  onStatusUpdate: (merchantId: string, newStatus: 'Active' | 'Inactive') => void;
  formatDate: (dateString: string) => string;
  selectedCluster: string;
  viewMode: 'overall' | 'cluster';
}

const MerchantRow: React.FC<MerchantRowProps> = ({
  merchant,
  onEdit,
  onDelete,
  onStatusUpdate,
  formatDate,
  selectedCluster,
  viewMode,
}) => {
  const navigate = useNavigate();
  const [extraStats, setExtraStats] = useState({
    users: '...',
    lastLogin: '...',
    lastVisitor: '...',
    lastVisitorId: '',
    lastVisitorIp: '',
    loading: false
  });

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-500',
    suspended: 'bg-yellow-100 text-yellow-800',
    unknown: 'bg-gray-100 text-gray-600',
  };

  const handleStatusChange = (newStatus: 'Active' | 'Inactive') => {
    onStatusUpdate(merchant.id, newStatus);
    setIsStatusDropdownOpen(false);
  };

  React.useEffect(() => {
    const fetchExtraStats = async () => {
      setExtraStats(prev => ({ ...prev, loading: true }));
      try {
        const usersPromise = merchantService.getAllUsers(merchant.id, merchant.cluster);
        const visitorsPromise = merchantService.getRawVisitors(merchant.id, 0, 1, merchant.cluster);

        const [users, visitorsResponse] = await Promise.all([usersPromise, visitorsPromise]);

        const activeCount = users.filter(u => u.status?.toLowerCase() === 'active').length;
        const totalCount = users.length;

        // Find latest user activity
        let latestLogin = 'N/A';
        if (users.length > 0) {
          const sorted = [...users].sort((a, b) => {
            const t1 = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
            const t2 = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
            return t2 - t1;
          });
          if (sorted[0].modifiedTime) {
            latestLogin = new Date(sorted[0].modifiedTime).toLocaleDateString();
          }
        }

        // Find latest visitor
        let latestVisitor = 'N/A';
        let visitorId = '';
        let visitorIp = '';
        if (visitorsResponse?.content && visitorsResponse.content.length > 0) {
          const latest = visitorsResponse.content[0];
          const vAt = latest.visitedAt || latest.lastAccessedDate_dt || latest.createTime;
          if (vAt) {
            latestVisitor = new Date(vAt).toLocaleDateString();
            visitorId = latest.visitorId || 'Anonymous';
            visitorIp = latest.ipAddress || '';
          }
        }

        setExtraStats({
          users: `${activeCount}/${totalCount}`,
          lastLogin: latestLogin,
          lastVisitor: latestVisitor,
          lastVisitorId: visitorId,
          lastVisitorIp: visitorIp,
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch extra stats:', err);
        setExtraStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchExtraStats();
  }, [merchant.id, merchant.cluster]);


  return (
    <>
      <tr className="transition-colors hover:bg-gray-50/50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(merchant)}
              className="group relative inline-flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-100 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-gray-800 cursor-pointer"
              title="Edit"
            >
              <FiEdit size={16} className="transition-transform group-hover:scale-110" />
            </button>
            <button
              onClick={() => navigate(`/merchants/${merchant.id}?cluster=${selectedCluster}`)}
              className="group relative inline-flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-100 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-gray-800 cursor-pointer"
              title="View Details"
            >
              <FiEye size={16} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-genx-700 leading-tight">{merchant.name}</span>
            <span className="text-[10px] font-mono text-gray-400 mt-0.5 select-all">{merchant.id}</span>
          </div>
        </td>
        {viewMode === 'overall' && (
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm">
                {merchant.cluster?.substring(0, 1).toUpperCase() || 'N'}
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{merchant.cluster}</span>
            </div>
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{merchant.email}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800">{extraStats.users}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active/Total</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 group/act" title={extraStats.lastLogin !== 'N/A' ? `Last Login: ${extraStats.lastLogin}` : 'No user activity recorded'}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.5)]"></span>
              <span className="text-[11px] font-medium text-gray-600">User: <span className="font-bold text-gray-800">{extraStats.lastLogin}</span></span>
            </div>
            <div className="flex items-center gap-1.5 group/act" title={extraStats.lastVisitorId ? `ID: ${extraStats.lastVisitorId}\nIP: ${extraStats.lastVisitorIp}` : 'No visitor activity recorded'}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_4px_rgba(251,146,60,0.5)]"></span>
              <span className="text-[11px] font-medium text-gray-600">Visitor: <span className="font-bold text-gray-800">{extraStats.lastVisitor}</span></span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="relative inline-block">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ${statusColors[(merchant.status || 'unknown').toLowerCase()] || 'bg-gray-100 text-gray-700'}`}
              disabled={merchant.status === 'suspended' || !merchant.status}
              title={merchant.status === 'suspended' ? 'Cannot change suspended status' : !merchant.status ? 'No status available' : 'Click to change status'}
            >
              {merchant.status ? merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1) : 'Unknown'}
            </button>

            {isStatusDropdownOpen && merchant.status && merchant.status !== 'suspended' && (
              <div className="absolute z-10 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200">
                {merchant.status.toLowerCase() === 'active' ? (
                  <button
                    onClick={() => handleStatusChange('Inactive')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Inactive
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('Active')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-genx-50 rounded-lg"
                  >
                    Active
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
};

export default MerchantList;
