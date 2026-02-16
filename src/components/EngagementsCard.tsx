import React, { useState, useEffect } from 'react';
import {
    FiPlus, FiRefreshCw, FiInfo, FiActivity, FiMessageCircle,
    FiMonitor, FiUsers, FiMessageSquare, FiChevronRight,
    FiEdit2, FiTrash2, FiExternalLink, FiBarChart2, FiArrowLeft, FiPhone, FiArrowRight
} from 'react-icons/fi';
import { BsChatDots, BsWindow, BsLayoutTextWindowReverse, BsMegaphone, BsFillChatDotsFill } from 'react-icons/bs';
import { FaFacebook, FaInstagram, FaSnapchatGhost } from 'react-icons/fa';
import { HiSpeakerphone } from 'react-icons/hi';
import { MdOutlineSpeakerNotes } from 'react-icons/md';
import { TbLayoutDashboard, TbLayoutGrid } from 'react-icons/tb';
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
                const rawType = (curr.type || '').toLowerCase();
                let displayType = 'Other';

                if (rawType.includes('web')) displayType = 'Website';
                else if (rawType.includes('messag')) displayType = 'Messenger';
                else if (rawType.includes('social') || rawType.includes('campaign')) displayType = 'Social Media';
                else if (rawType.includes('smart') || rawType.includes('page')) displayType = 'Smart Pages';
                else if (rawType.includes('platform') || rawType.includes('ads')) displayType = 'Platforms';
                else displayType = curr.type || 'Other';

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
        const iconColor = "#6b21a8";

        if (t.includes('website')) return <BsWindow size={22} className="text-[#6b21a8]" />;
        if (t.includes('messenger')) return <BsFillChatDotsFill size={22} className="text-[#6b21a8]" />;
        if (t.includes('social')) return (
            <div className="relative w-full h-full flex items-center justify-center">
                <FaFacebook size={12} className="absolute top-1 left-1 text-[#6b21a8]" />
                <FaInstagram size={12} className="absolute bottom-1 right-1 text-[#6b21a8]" />
                <FaSnapchatGhost size={12} className="absolute top-1 right-1 text-[#6b21a8]" />
            </div>
        );
        if (t.includes('smart')) return <BsLayoutTextWindowReverse size={22} className="text-[#6b21a8]" />;
        if (t.includes('platform')) return (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="scale-x-[-1]"><HiSpeakerphone size={22} className="text-[#6b21a8]" /></div>
            </div>
        );
        return <FiActivity size={22} className="text-[#6b21a8]" />;
    };

    const getCategoryLabel = (type: string) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('website')) return 'Chatbot';
        if (t.includes('messenger')) return 'Chatbot';
        if (t.includes('social')) return 'Campaigns';
        if (t.includes('smart')) return 'Conversational';
        if (t.includes('platform')) return 'Ads';
        return 'Engagement';
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-medium text-gray-700">My Engagements</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-3.5 h-3.5 flex items-center justify-center text-[#f59e0b]">
                            <FiInfo size={14} />
                        </div>
                        <p className="text-[11px] text-gray-400">
                            Create & manage your customer engagements, that could be used in your websites, ads, campaigns, emails etc.
                        </p>
                    </div>
                </div>
                {!selectedGroup && (
                    <button
                        className="px-4 py-1.5 bg-[#1a3a6d] text-white rounded-md text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#152e56] transition-all shadow-sm"
                    >
                        <FiPlus size={14} />
                        Create
                    </button>
                )}
                {selectedGroup && (
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="bg-[#1a3a6d] text-white px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#152e56] transition-all shadow-sm group"
                    >
                        <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                )}
            </div>

            <div className="border-t border-dashed border-gray-200 w-full pt-6">
                {/* Notifications */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <FiInfo size={12} />
                        </div>
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-600 rounded-lg text-xs font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <FiActivity size={12} />
                        </div>
                        {successMessage}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <div className="w-10 h-10 border-4 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-bold text-gray-400 titlecase tracking-widest">Loading engagements...</p>
                    </div>
                ) : engagements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <FiActivity className="text-gray-300" size={28} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-600 mb-1">No Engagements Found</h4>
                        <p className="text-xs text-gray-400">Click "Create" to add your first engagement.</p>
                    </div>
                ) : (
                    selectedGroup ? (
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Status</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Action</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Preview</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Analytics</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Channel</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Name</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Chat Bot</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Page Name</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">AI Agent</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Created By</th>
                                            <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 titlecase tracking-wider">Created Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {engagements
                                            .find(g => g.type === selectedGroup)
                                            ?.examples.map((item: any) => {
                                                const isActive = item.status?.toLowerCase() === 'active';
                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors titlecase">
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleToggleStatus(item)}
                                                                    disabled={actionLoading === item.id}
                                                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-900 focus:ring-offset-1 ${isActive ? 'bg-emerald-500' : 'bg-gray-300'} ${actionLoading === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    title={isActive ? 'Disable Engagement' : 'Enable Engagement'}
                                                                >
                                                                    <span
                                                                        className={`${isActive ? 'translate-x-4' : 'translate-x-1'} inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform flex items-center justify-center`}
                                                                    >
                                                                        {actionLoading === item.id && (
                                                                            <div className="w-1.5 h-1.5 border-[1px] border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                                                                        )}
                                                                    </span>
                                                                </button>
                                                                <span className={`text-[9px] font-black titlecase tracking-widest ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {item.status || 'Active'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <div className="flex items-center gap-1">
                                                                {actionLoading === item.id ? (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded">
                                                                        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                                        <span className="text-[9px] font-bold text-indigo-600 uppercase">Wait...</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleEditEngagement(item)}
                                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-900 hover:text-white transition-all shadow-sm border border-gray-100"
                                                                            title="Edit"
                                                                        >
                                                                            <FiEdit2 size={12} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteEngagement(item)}
                                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-gray-100"
                                                                            title="Delete"
                                                                        >
                                                                            <FiTrash2 size={12} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <a
                                                                href={getPreviewUrl(item)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                                                title="Open Preview"
                                                            >
                                                                <FiExternalLink size={14} />
                                                            </a>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <button className="inline-flex items-center justify-center p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" title="View Analytics">
                                                                <FiBarChart2 size={14} />
                                                            </button>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5">
                                                                {item.channel?.name?.toLowerCase().includes('web') ? (
                                                                    <FiMonitor className="text-rose-500" size={14} />
                                                                ) : (
                                                                    <FiPhone className="text-green-500" size={14} />
                                                                )}
                                                                <span className="text-xs text-gray-700">{item.channel?.name || 'Unknown'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900 truncate max-w-[120px]" title={item.name || item.engagementName}>
                                                            {item.name || item.engagementName}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500">
                                                            {item.botList?.[0]?.botTemplateName || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500">
                                                            {item.channel?.reference || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                                    {((item.aiAgent?.agentImage && item.aiAgent.agentImage[0]) || item.aiAgent?.image) ? (
                                                                        <img
                                                                            src={(item.aiAgent?.agentImage && item.aiAgent.agentImage[0]) || item.aiAgent?.image}
                                                                            alt={item.aiAgent?.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-[8px] font-bold text-gray-600">
                                                                            {(item.aiAgent?.name || 'A').charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] font-medium text-gray-700">{item.aiAgent?.name || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500">
                                                            {item.createdBy || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300">
                            {engagements.map((group, idx) => (
                                <div
                                    key={group.type || idx}
                                    onClick={() => setSelectedGroup(group.type)}
                                    className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0 border border-[#fde68a]">
                                        {React.cloneElement(getIcon(group.type) as React.ReactElement, { size: 20 })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[9px] font-bold text-gray-400 mb-0.5 tracking-tight uppercase">
                                            {getCategoryLabel(group.type)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[15px] font-bold text-gray-700 truncate leading-tight">
                                                {group.type}
                                            </h3>
                                            <span className="bg-[#6b21a8] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-4.5 flex items-center justify-center">
                                                {group.count}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
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
