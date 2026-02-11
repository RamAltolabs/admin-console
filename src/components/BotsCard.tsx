import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCpu, FiRefreshCw, FiPlayCircle, FiPauseCircle, FiInfo } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import BotDetailsModal from './BotDetailsModal';

interface BotsCardProps {
    merchantId: string;
    cluster?: string;
}

interface Bot {
    id: string;
    botTemplateName?: string;
    status?: string;
    botId?: string;
    botAccess?: string;
    botName?: string;
    description?: string;
    title?: string;
    type?: string;
    botImage1?: string;
    botImage2?: string;
    [key: string]: any;
}

const BotsCard: React.FC<BotsCardProps> = ({ merchantId, cluster }) => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBots = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await merchantService.getMerchantBots(merchantId, undefined, cluster);

            let botList: Bot[] = [];

            // Handle nested myBots structure
            if (data?.myBots && Array.isArray(data.myBots)) {
                // Flatten bots from all merchant entries in myBots
                botList = data.myBots.flatMap((mb: any) => {
                    return (mb.bot || []).map((b: any) => ({
                        ...b,
                        id: b.botId || b.id,
                        botTemplateName: b.title || b.botName,
                        botAccess: b.botAccess,
                        status: b.status,
                        description: b.description,
                        botId: b.botId,
                        botName: b.botName,
                        type: b.type
                    }));
                });
            } else {
                // Fallback to previous robust handling
                botList = Array.isArray(data) ? data : (data?.content || data?.data || []);
            }

            setBots(Array.isArray(botList) ? botList : []);
        } catch (err) {
            console.error('Error fetching bots:', err);
            setError('Failed to load bots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchBots();
        }
    }, [merchantId, cluster]);

    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const handleDeleteBot = async (bot: Bot) => {
        if (!window.confirm(`Are you sure you want to delete "${bot.botTemplateName || bot.botName}"?`)) {
            return;
        }

        try {
            await merchantService.deleteMerchantBot(bot.botId || bot.id, merchantId, cluster);
            // Refresh list
            fetchBots();
        } catch (error) {
            console.error('Failed to delete bot:', error);
            setError('Failed to delete bot');
        }
    };

    const handleViewDetails = (bot: Bot) => {
        setSelectedBot(bot);
        setShowDetailsModal(true);
    };

    if (loading && bots.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-genx-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-genx-200 overflow-hidden">
            {showDetailsModal && (
                <BotDetailsModal
                    bot={selectedBot}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}

            <div className="p-6 border-b border-genx-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <FiCpu size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Bots</h3>
                        <p className="text-sm text-gray-500">Manage AI assistants</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchBots}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw size={18} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <FiPlus size={16} />
                        <span className="text-sm font-medium">Add Bot</span>
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {bots.length > 0 ? (
                    bots.map((bot, index) => (
                        <div key={bot.id || index} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    <img
                                        src={bot.botImage1 || 'https://it-inferno.neocloud.ai/img/chatbot-template.png'}
                                        alt={bot.botTemplateName || 'Bot'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://it-inferno.neocloud.ai/img/chatbot-template.png';
                                        }}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{bot.botTemplateName || 'Unnamed Bot'}</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {bot.groupName && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                {bot.groupName}
                                            </span>
                                        )}
                                        {bot.type && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                {bot.type}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bot.status?.toLowerCase() === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {bot.status?.toLowerCase() === 'active' ? <FiPlayCircle size={10} /> : <FiPauseCircle size={10} />}
                                            {bot.status || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleViewDetails(bot)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Details"
                                >
                                    <FiInfo size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteBot(bot)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center">
                        <div className="inline-flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full mb-3 text-gray-400">
                            <FiCpu size={24} />
                        </div>
                        <p className="text-gray-500 font-medium">No bots configured</p>
                        <p className="text-sm text-gray-400 mt-1">Add a bot to start automating</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BotsCard;
