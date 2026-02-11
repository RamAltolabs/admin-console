import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCpu, FiRefreshCw, FiPlayCircle, FiPauseCircle, FiLayers, FiZap, FiShoppingBag, FiInfo, FiSend, FiTarget } from 'react-icons/fi';
import BotDetailsModal from './BotDetailsModal';
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
            label: 'Agent Builder',
            icon: FiCpu,
            count: bots.filter(b => {
                const type = (b.type || b.botType || '').toLowerCase();
                return type === 'chatbot' || type === 'skill' || type === 'extension';
            }).length
        },
        { id: 'workflow', label: 'Agent Workflow', icon: FiZap, count: bots.filter(b => ((b.type || b.botType || '').toLowerCase()) === 'flowbot').length },
    ];

    if (loading && bots.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-genx-200 p-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[180px] bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

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

                <div className="flex border-b border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'builder' | 'workflow')}
                            className={`flex-1 p-4 text-sm font-medium text-center flex items-center justify-center gap-2 transition-colors relative ${activeTab === tab.id
                                ? 'text-blue-600 bg-blue-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {tab.count}
                            </span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBots.map((bot, index) => (
                    <div key={bot.id || index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all h-[180px] flex flex-col justify-between group relative">
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-1 rounded-lg inline-flex flex-shrink-0">
                                        <img
                                            src={bot.botImage1 || 'https://it-inferno.neocloud.ai/img/chatbot-template.png'}
                                            alt={bot.botTemplateName || 'Bot'}
                                            className="w-10 h-10 object-cover rounded-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://it-inferno.neocloud.ai/img/chatbot-template.png';
                                            }}
                                        />
                                    </div>
                                    <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm" title={bot.botTemplateName}>
                                        {bot.botTemplateName || 'Unnamed Agent'}
                                    </h4>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${(bot.status?.toLowerCase() || '') === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {bot.status || 'Draft'}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-2">
                                {bot.groupName && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                        <FiLayers className="mr-1" size={10} />
                                        {bot.groupName}
                                    </span>
                                )}
                                {bot.type && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                        <FiZap className="mr-1" size={10} />
                                        {bot.type}
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                {bot.description || 'No description provided.'}
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {actionLoading === bot.id ? (
                                <div className="flex items-center gap-2 py-1 bg-indigo-50 px-3 rounded-lg border border-indigo-100">
                                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Processing...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleViewDetails(bot)}
                                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Details"
                                        >
                                            <FiInfo size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBot(bot)}
                                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handlePublishBot(bot)}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-[#22a6dc] hover:bg-[#1d95c7] text-white rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
                                        title="Publish"
                                    >
                                        <FiTarget size={14} className="stroke-[3]" />
                                        <span className="font-bold text-[11px] uppercase tracking-wider">Publish</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgentiAICard;
