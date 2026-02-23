import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCpu, FiRefreshCw, FiPlayCircle, FiPauseCircle, FiLayers, FiZap, FiShoppingBag, FiInfo, FiSend, FiTarget, FiEye } from 'react-icons/fi';
import BotDetailsModal from './BotDetailsModal';
import AIAgentFormModal from './AIAgentFormModal';
import merchantService from '../services/merchantService';

interface AgentiAICardProps {
    merchantId: string;
    cluster?: string;
}

interface Bot {
    id: string;
    botTemplateName?: string;
    status?: string;
    botId?: string;
    type?: string; // 'chatbot' or 'flowbot'
    botType?: string; // Alternative property name
    description?: string;
    botAccess?: string;
    botName?: string;
    title?: string;
    botImage1?: string;
    botImage2?: string;
    // New fields from AI Agents API
    identifier?: string;
    image?: string;
    agentImage?: string[];
    persona?: string;
    goal?: string;
    [key: string]: any;
}

const AgentiAICard: React.FC<AgentiAICardProps> = ({ merchantId, cluster }) => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'builder' | 'workflow'>('builder');

    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchBots = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch from both APIs in parallel
            const [merchantBotsResult, aiAgentsResult] = await Promise.allSettled([
                merchantService.getMerchantBots(merchantId, undefined, cluster),
                merchantService.getAIAgents(merchantId, cluster)
            ]);

            let botList: Bot[] = [];

            // Process Merchant Bots (focusing on Flowbots/Legacy)
            if (merchantBotsResult.status === 'fulfilled') {
                const data = merchantBotsResult.value;
                let legacyBots: Bot[] = [];

                if (data?.myBots && Array.isArray(data.myBots)) {
                    legacyBots = data.myBots.flatMap((mb: any) => {
                        return (mb.bot || []).map((b: any) => ({
                            ...b,
                            id: b.botId || b.id,
                            botTemplateName: b.title || b.botName,
                            botAccess: b.botAccess,
                            status: b.status,
                            description: b.description,
                            botId: b.botId,
                            botName: b.botName,
                            type: b.type,
                            botType: b.botType || b.type
                        }));
                    });
                } else {
                    legacyBots = data?.content || data?.data || (Array.isArray(data) ? data : []);
                }

                // Add legacy bots (flows/skills)
                if (Array.isArray(legacyBots)) {
                    botList.push(...legacyBots);
                }
            }

            // Process AI Agents (New API - "Agent Builder")
            if (aiAgentsResult.status === 'fulfilled') {
                const agents = aiAgentsResult.value;
                if (Array.isArray(agents)) {
                    const agentBots = agents.map((agent: any) => ({
                        ...agent,
                        id: agent.id,
                        botId: agent.id, // Ensure botId is set for deletion/details
                        botTemplateName: agent.identifier, // Map identifier to name
                        botName: agent.identifier,
                        status: agent.status,
                        type: 'chatbot', // Explicitly set type for Agent Builder tab
                        botType: 'chatbot',
                        botImage1: agent.image || (agent.agentImage && agent.agentImage[0]), // Map image
                        description: agent.goal || agent.persona || agent.description // Map description
                    }));

                    // Filter out duplicates if necessary, or just push. 
                    // Assuming AI Agents ID space is distinct or we prefer them.
                    // We'll push them. If duplicates exist by ID, we might need to dedup.
                    botList.push(...agentBots);
                }
            }

            // Deduplicate by ID if needed (optional but good practice)
            const uniqueBots = Array.from(new Map(botList.map(item => [item.id, item])).values());

            setBots(uniqueBots);

            // If both failed and we have no bots, show error
            if (merchantBotsResult.status === 'rejected' && aiAgentsResult.status === 'rejected' && uniqueBots.length === 0) {
                setError('Failed to load Agentic AI bots from both sources. Please check your connection.');
            } else if (merchantBotsResult.status === 'rejected' || aiAgentsResult.status === 'rejected') {
                console.warn('One or more Agentic AI APIs failed, showing partial results.');
            }
        } catch (err) {
            console.error('Error fetching bots:', err);
            setError('Failed to load Agentic AI bots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchBots();
        }
    }, [merchantId, cluster]);

    // Filter bots based on active tab
    const filteredBots = bots.filter(bot => {
        console.log('Bot:', bot); // Debugging log
        const botType = (bot.type || bot.botType || '').toLowerCase();
        if (activeTab === 'builder') {
            return botType === 'chatbot' || botType === 'skill' || botType === 'extension';
        } else {
            return botType === 'flowbot';
        }
    });

    const tabs = [
        {
            id: 'builder',
            label: 'Chatbots',
            icon: FiCpu,
            count: bots.filter(b => {
                const type = (b.type || b.botType || '').toLowerCase();
                return type === 'chatbot' || type === 'skill' || type === 'extension';
            }).length
        },
        { id: 'workflow', label: 'Flowbots', icon: FiZap, count: bots.filter(b => ((b.type || b.botType || '').toLowerCase()) === 'flowbot').length },
    ];

    // Loading state is now handled within the main return to keep UI stable

    const handleEditBot = (bot: Bot) => {
        setSelectedBot(bot);
        setShowEditModal(true);
    };

    const handleUpdateBot = async (payload: any) => {
        try {
            await merchantService.updateAIAgent(payload, cluster);
            await fetchBots();
            setShowEditModal(false);
        } catch (error) {
            console.error('Failed to update bot:', error);
            throw error;
        }
    };

    const handleDeleteBot = async (bot: Bot) => {
        if (!window.confirm(`Are you sure you want to delete "${bot.botTemplateName || bot.botName}"?`)) {
            return;
        }

        setActionLoading(bot.id);
        setError(null);
        setSuccessMessage(null);

        try {
            await merchantService.deleteMerchantBot(bot.botId || bot.id, merchantId, cluster);
            setSuccessMessage(`Agent "${bot.botTemplateName || bot.botName}" deleted successfully`);

            // Refresh list
            fetchBots();

            // Clear message after timeout
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error('Failed to delete bot:', error);
            setError('Failed to delete agentic AI record');
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetails = (bot: Bot) => {
        setSelectedBot(bot);
        setShowDetailsModal(true);
    };

    const handlePublishBot = async (bot: Bot) => {
        if (!window.confirm(`Are you sure you want to publish "${bot.botTemplateName || bot.botName}"?`)) {
            return;
        }

        setActionLoading(bot.id);
        setError(null);
        setSuccessMessage(null);

        try {
            const groupName = bot.groupName || 'Enterprise';
            const merchantRef = merchantId;
            const botName = bot.botName || bot.botTemplateName || '';

            if (!botName) {
                throw new Error('Bot name is missing');
            }

            await merchantService.publishAgenticAI(botName, groupName, merchantRef, cluster);
            setSuccessMessage(`Agent "${bot.botTemplateName || bot.botName}" published successfully`);

            // Refresh list if needed (though status might not change immediately)
            fetchBots();

            // Clear message after timeout
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error: any) {
            console.error('Failed to publish bot:', error);
            setError(`Failed to publish agent: ${error.message || 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    // ... (rest of the component)

    return (
        <div className="flex flex-col gap-6">
            {showDetailsModal && (
                <BotDetailsModal
                    bot={selectedBot}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}

            {showEditModal && (
                <AIAgentFormModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleUpdateBot}
                    agent={selectedBot}
                />
            )}

            <div className="bg-white rounded-xl shadow-sm border border-genx-200 overflow-hidden">
                {/* Notifications */}
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <FiInfo size={16} />
                        </div>
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="p-4 bg-green-50 border-b border-green-100 text-green-600 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <FiZap size={16} className="text-green-600" />
                        </div>
                        {successMessage}
                    </div>
                )}

                <div className="p-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex bg-gray-200/50 p-1 rounded-lg">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'builder' | 'workflow')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === tab.id
                                    ? 'bg-blue-900 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-blue-900 hover:bg-gray-100'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold text-gray-900">Fetching Agentic AI...</p>
                        <p className="text-xs text-gray-500">Connecting to AI Suite services</p>
                    </div>
                ) : filteredBots.length > 0 ? (
                    filteredBots.map((bot, index) => {
                        const isActive = (bot.status?.toLowerCase() || '') === 'active';
                        return (
                            <div key={bot.id || index} className="standard-tile relative group min-h-[125px] flex-col !items-start bg-white !p-3.5">
                                {/* Top row: Avatar and Basic Info */}
                                <div className="flex items-start gap-4 w-full">
                                    {/* Avatar with StatusIndicator */}
                                    <div className="relative flex-shrink-0">
                                        <div className="standard-tile-avatar group-hover:scale-105 transition-transform overflow-hidden !w-12 !h-12 bg-gray-50 border border-gray-100">
                                            <img
                                                src={bot.botImage1 || 'https://it-inferno.neocloud.ai/img/chatbot-template.png'}
                                                alt={bot.botTemplateName || 'Bot'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://it-inferno.neocloud.ai/img/chatbot-template.png';
                                                }}
                                            />
                                        </div>
                                        <div className="absolute -top-1 -right-1">
                                            <span className={`block w-3.5 h-3.5 bg-white rounded-full border-2 border-white shadow-sm transition-all ${isActive ? 'bg-green-500' : 'bg-yellow-500'}`} title={bot.status || 'Draft'}></span>
                                        </div>
                                    </div>

                                    {/* Title and Badge */}
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h4 className="font-bold text-gray-900 text-[14px] truncate leading-tight mb-1" title={bot.botTemplateName}>
                                            {bot.botTemplateName || 'Unnamed Agent'}
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {bot.groupName && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500 titlecase tracking-tighter">
                                                    {bot.groupName}
                                                </span>
                                            )}
                                            {bot.type && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 titlecase tracking-tighter">
                                                    {bot.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description Section - Filled */}
                                <div className="mt-2.5 w-full">
                                    <p className="text-[11px] text-gray-500 line-clamp-1 leading-normal h-[16px]">
                                        {bot.description || 'No description provided.'}
                                    </p>
                                </div>

                                {/* Header Actions - Compact */}
                                <div className="mt-auto pt-2.5 w-full border-t border-gray-100 flex items-center justify-between">
                                    <button
                                        onClick={() => handlePublishBot(bot)}
                                        className="tile-btn-view"
                                        title="Publish"
                                    >
                                        <FiTarget className="mr-1" />
                                        Publish
                                    </button>
                                </div>

                                {/* Actions Group - Ultra Compact */}
                                <div className="absolute bottom-3.5 right-3.5 flex flex-col items-center gap-1.5 opacity-100">
                                    {actionLoading === bot.id ? (
                                        <div className="p-0.5 border border-indigo-100 bg-white rounded flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleViewDetails(bot)}
                                                className="tile-btn-view"
                                                title="View Details"
                                            >
                                                <FiEye size={10} />
                                            </button>
                                            <button
                                                onClick={() => handleEditBot(bot)}
                                                className="tile-btn-edit"
                                                title="Edit Agent"
                                            >
                                                <FiEdit2 size={10} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBot(bot)}
                                                className="tile-btn-delete"
                                                title="Delete Agent"
                                            >
                                                <FiTrash2 size={10} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <FiCpu size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1">No {activeTab === 'builder' ? 'Chatbots' : 'Flowbots'} Discovered</h3>
                        <p className="text-xs text-gray-500 max-w-xs">
                            We couldn't find any {activeTab === 'builder' ? 'Chatbots' : 'Flowbots'} for this merchant in the currently selected merchant.
                        </p>
                        <button
                            onClick={() => fetchBots()}
                            disabled={loading}
                            className={`mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FiRefreshCw className={`inline ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentiAICard;
