import React, { useState, useEffect } from 'react';
import {
    FiPlus, FiRefreshCw, FiInfo, FiActivity, FiMessageCircle,
    FiMonitor, FiUsers, FiMessageSquare, FiChevronRight,
    FiEdit2, FiTrash2, FiExternalLink, FiBarChart2, FiArrowLeft, FiPhone
} from 'react-icons/fi';
import merchantService from '../services/merchantService';
import EngagementFormModal from './EngagementFormModal';

interface EngagementsCardProps {
    merchantId: string;
    cluster?: string;
}

const EngagementsCard: React.FC<EngagementsCardProps> = ({ merchantId, cluster }) => {
    const [loading, setLoading] = useState(false);
    const [engagements, setEngagements] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedEngagement, setSelectedEngagement] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Pagination states
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const getPreviewUrl = (engagement: any) => {
        // Logic to determine base URL based on current hostname or cluster
        // Mapping: app6a -> api6a-inferno, etc.
        const hostname = window.location.hostname;
        let apiPrefix = 'it-inferno'; // Default fallback

        if (hostname.includes('app6a')) apiPrefix = 'api6a-inferno';
        else if (hostname.includes('app6e')) apiPrefix = 'api6e-inferno';
        else if (hostname.includes('app30a')) apiPrefix = 'api30a-inferno';
        else if (hostname.includes('it-inferno')) apiPrefix = 'it-inferno';

        return `https://${apiPrefix}.neocloud.ai/chat.html?id=${engagement.id}&&${engagement.name}&&${merchantId}`;
    };

    const fetchEngagements = async (page: number = pageIndex) => {
        setLoading(true);
        setError(null);
        try {
            const response = await merchantService.getEngagementList(merchantId, cluster, page, pageSize);
            // API returns { engagements: [...] } or paginated response
            let list: any[] = [];
            let total = 0;
            let pages = 0;

            if (response?.engagements) {
                list = response.engagements;
                // Check for pagination metadata
                total = response.totalElements || response.total || list.length;
                pages = response.totalPages || Math.ceil(total / pageSize) || 1;
            } else if (Array.isArray(response)) {
                list = response;
                total = list.length;
                pages = 1;
            } else if (response?.content) {
                // Paginated response
                list = response.content;
                total = response.totalElements || response.total || list.length;
                pages = response.totalPages || Math.ceil(total / pageSize) || 1;
            }

            // Group by Type (e.g. Website, Messaging Platforms)
            const grouped = list.reduce((acc: any, curr: any) => {
                const rawType = curr.type || 'Other';
                // Normalize type for display (e.g. Messaging Platforms -> Messenger)
                let displayType = 'Other';
                if (rawType.toLowerCase().includes('web')) displayType = 'Website';
                else if (rawType.toLowerCase().includes('messag')) displayType = 'Messenger';
                else displayType = rawType;

                if (!acc[displayType]) {
                    acc[displayType] = {
                        type: displayType,
                        count: 0,
                        examples: []
                    };
                }
                acc[displayType].count++;
                acc[displayType].examples.push(curr);
                return acc;
            }, {});

            setEngagements(Object.values(grouped));
            setTotalElements(total);
            setTotalPages(pages);
        } catch (err) {
            console.error('Error fetching engagements:', err);
            setError('Failed to load engagements');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (engagement: any) => {
        const newStatus = engagement.status?.toLowerCase() === 'active' ? 'Inactive' : 'Active';
        const action = newStatus === 'Active' ? 'enable' : 'disable';

        if (!window.confirm(`Are you sure you want to ${action} this engagement?`)) return;

        setActionLoading(engagement.id);
        setError(null);
        setSuccessMessage(null);

        try {
            const updatedEngagement = { ...engagement, status: newStatus };
            await merchantService.updateEngagement(updatedEngagement, cluster);

            setSuccessMessage(`Engagement ${action}d successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);

            // Refresh list
            fetchEngagements();
        } catch (err) {
            console.error('Error updating engagement status:', err);
            setError(`Failed to ${action} engagement`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEditEngagement = (engagement: any) => {
        setSelectedEngagement(engagement);
        setIsEditModalOpen(true);
    };

    const handleSaveEngagement = async (payload: any) => {
        setError(null);
        setSuccessMessage(null);
        try {
            await merchantService.updateEngagement(payload, cluster);
            setSuccessMessage('Engagement updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
            fetchEngagements();
        } catch (err) {
            console.error('Error saving engagement:', err);
            setError('Failed to update engagement');
            throw err;
        }
    };

    const handleDeleteEngagement = async (engagement: any) => {
        if (!window.confirm('Are you sure you want to delete this engagement? This action cannot be undone.')) return;

        setActionLoading(engagement.id);
        setError(null);
        setSuccessMessage(null);

        try {
            await merchantService.deleteEngagement(engagement, cluster);
            setSuccessMessage('Engagement deleted successfully');

            // Refresh list without showing the full screen loader if possible
            // We'll call fetchEngagements but we might want a specialized version that doesn't set global 'loading'
            // To keep things simple, we'll just continue using fetchEngagements
            fetchEngagements();

            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            console.error('Error deleting engagement:', err);
            setError('Failed to delete engagement');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePageChange = (newPageIndex: number) => {
        if (newPageIndex >= 0 && newPageIndex < totalPages) {
            setPageIndex(newPageIndex);
            fetchEngagements(newPageIndex);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchEngagements(0);
            setPageIndex(0);
        }
    }, [merchantId, cluster]);

    const getIcon = (type: string) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('website') || t.includes('web')) return <FiMonitor size={24} className="text-white" />;
        if (t.includes('messenger') || t.includes('chat')) return <FiMessageCircle size={24} className="text-white" />;
        return <FiActivity size={24} className="text-white" />;
    };

    const getIconBg = (type: string) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('website')) return 'bg-rose-500';
        if (t.includes('messenger')) return 'bg-orange-500';
        return 'bg-indigo-500';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    {selectedGroup ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedGroup(null)}
                                className="flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors group"
                            >
                                <FiArrowLeft className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back
                            </button>
                            <h2 className="text-xl font-bold text-[#1a365d]">
                                My Engagements <span className="text-gray-400 font-normal">»</span> {selectedGroup}
                            </h2>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#1a365d]">My Engagements</h2>
                            <FiInfo size={16} className="text-gray-400 cursor-help" />
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <button
                        onClick={() => fetchEngagements(pageIndex)}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
                        title="Refresh Data"
                    >
                        <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="bg-[#1a365d] hover:bg-[#2a4a7d] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95">
                        <FiPlus />
                        Create
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <FiInfo size={16} />
                    </div>
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <FiActivity size={16} />
                    </div>
                    {successMessage}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading engagements...</p>
                </div>
            ) : engagements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <FiActivity size={32} />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">No Engagements Found</p>
                    <p className="text-gray-400 text-sm mt-1">Click "Create" to add your first engagement.</p>
                </div>
            ) : (
                selectedGroup ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Preview</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Analytics</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Channel</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Chat Bot</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Page Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">AI Agent</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {engagements
                                        .find(g => g.type === selectedGroup)
                                        ?.examples.map((item: any) => {
                                            const isActive = item.status?.toLowerCase() === 'active';
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleToggleStatus(item)}
                                                                disabled={actionLoading === item.id}
                                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'} ${actionLoading === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                title={isActive ? 'Disable Engagement' : 'Enable Engagement'}
                                                            >
                                                                <span
                                                                    className={`${isActive ? 'translate-x-5' : 'translate-x-1'} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform flex items-center justify-center`}
                                                                >
                                                                    {actionLoading === item.id && (
                                                                        <div className="w-2 h-2 border-[1px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    )}
                                                                </span>
                                                            </button>
                                                            <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-green-600' : 'text-rose-600'}`}>
                                                                {item.status || 'Active'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {actionLoading === item.id ? (
                                                                <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg">
                                                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Processing...</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEditEngagement(item)}
                                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <FiEdit2 size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteEngagement(item)}
                                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <FiTrash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <a
                                                            href={getPreviewUrl(item)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                            title="Open Preview"
                                                        >
                                                            <FiExternalLink size={16} />
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <button className="inline-flex items-center justify-center p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors" title="View Analytics">
                                                            <FiBarChart2 size={16} />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {item.channel?.name?.toLowerCase().includes('web') ? (
                                                                <FiMonitor className="text-rose-500" size={18} />
                                                            ) : (
                                                                <FiPhone className="text-green-500" size={18} />
                                                            )}
                                                            <span className="text-sm text-gray-700">{item.channel?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.name || item.engagementName}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.botList?.[0]?.botTemplateName || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.channel?.reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                                {((item.aiAgent?.agentImage && item.aiAgent.agentImage[0]) || item.aiAgent?.image) ? (
                                                                    <img
                                                                        src={(item.aiAgent?.agentImage && item.aiAgent.agentImage[0]) || item.aiAgent?.image}
                                                                        alt={item.aiAgent?.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-[10px] font-bold text-gray-600">
                                                                        {(item.aiAgent?.name || 'A').charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">{item.aiAgent?.name || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.createdBy || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                        {engagements.map((group, idx) => (
                            <div
                                key={group.type || idx}
                                onClick={() => setSelectedGroup(group.type)}
                                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 ${getIconBg(group.type)} rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                                        {getIcon(group.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                            Chatbot
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-[#1a365d] truncate">
                                                {group.type}
                                            </h3>
                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                                {group.count}
                                            </span>
                                        </div>
                                    </div>
                                    <FiChevronRight className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            <EngagementFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEngagement}
                engagement={selectedEngagement}
                merchantId={merchantId}
                cluster={cluster}
            />
        </div>
    );
};

export default EngagementsCard;
