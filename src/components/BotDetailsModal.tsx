import React from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

interface Bot {
    id?: string | number;
    botId?: string | number;
    botTemplateName?: string;
    botName?: string;
    title?: string;
    description?: string;
    status?: string;
    botAccess?: string;
    type?: string;
    groupName?: string;
    category?: string;
    language?: string;
    languages?: string[] | string;
    botImage1?: string;
    botImage2?: string;
    [key: string]: any;
}

interface BotDetailsModalProps {
    bot: Bot | null;
    onClose: () => void;
}

const DEFAULT_BOT_IMAGE_URL = 'https://live-inferno.neocloud.ai/img/chatbot-template.png';

const BotDetailsModal: React.FC<BotDetailsModalProps> = ({ bot, onClose }) => {
    if (!bot) return null;

    const botName = bot.botTemplateName || bot.title || bot.botName || 'Bot Details';
    const botType = bot.type || 'chatbot';
    const botAccess = bot.botAccess || 'Public';
    const botStatus = bot.status || 'Active';
    const botCategory = bot.category || bot.groupName || 'Telecom';
    const botLanguages =
        Array.isArray(bot.languages) && bot.languages.length > 0
            ? bot.languages.join(', ')
            : (typeof bot.languages === 'string' && bot.languages.trim()) || bot.language || 'English';
    const imageUrl = bot.botImage1 || bot.botImage2 || DEFAULT_BOT_IMAGE_URL;

    return (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px] p-3 md:p-5 overflow-y-auto">
            <div className="bg-[#f3f4f6] border border-gray-200 rounded-xl w-full max-w-[900px] mx-auto p-4 md:p-5 shadow-xl">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onClose}
                        className="h-8 w-8 inline-flex items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:text-gray-700"
                        title="Close"
                    >
                        <FiX size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                        <img
                            src={imageUrl}
                            alt={botName}
                            className="w-[110px] h-[110px] object-cover bg-[#d8e8f3] rounded"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_BOT_IMAGE_URL;
                            }}
                        />

                        <div>
                            <h2 className="text-[22px] md:text-[24px] font-medium text-gray-900 leading-tight mb-3">{botName}</h2>

                            <div className="grid grid-cols-3 gap-3 max-w-[420px]">
                                <div>
                                    <p className="text-[14px] text-[#546a87] mb-1">Status</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#3bb86f] text-white text-[16px] leading-none font-medium">
                                        {botStatus}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[14px] text-[#546a87] mb-1">Bot Type</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#d9d9d9] text-gray-900 text-[14px] leading-none">
                                        {botType}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[14px] text-[#546a87] mb-1">Bot Access</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#d9d9d9] text-gray-900 text-[14px] leading-none">
                                        {botAccess}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-l border-gray-300 pl-4 space-y-4">
                        <div>
                            <h3 className="text-[16px] text-[#546a87] mb-1">Description</h3>
                            <p className="text-[14px] text-[#455a74] leading-snug">{bot.description || 'N/A'}</p>
                        </div>
                        <div className="border-t border-gray-300 pt-4">
                            <h3 className="text-[16px] text-[#546a87] mb-1">Category</h3>
                            <p className="text-[14px] text-[#455a74]">{botCategory}</p>
                        </div>
                        <div>
                            <h3 className="text-[16px] text-[#546a87] mb-1">Languages</h3>
                            <p className="text-[14px] text-[#455a74]">{botLanguages}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <h3 className="text-[20px] text-[#546a87] mb-2">Webhook Handlers</h3>
                    <div className="border-t border-gray-300 pt-3 flex gap-3">
                        <input
                            type="text"
                            value=""
                            readOnly
                            placeholder="Generate Handler"
                            className="flex-1 h-10 bg-[#ececec] border border-gray-300 rounded px-4 text-sm text-gray-400"
                        />
                        <button className="h-10 min-w-[180px] px-4 bg-[#6f83b8] text-white rounded font-medium text-sm">
                            Generate Handler
                        </button>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[20px] text-[#546a87]">Event Callback</h3>
                        <button className="h-10 px-4 border border-[#6f83b8] text-[#6f83b8] rounded text-sm font-medium bg-white">
                            Add Event Callback
                        </button>
                    </div>
                    <div className="border-t border-gray-300 pt-3 mt-2 grid grid-cols-[230px_1fr_30px] gap-3 items-center">
                        <div className="relative">
                            <select className="w-full h-10 bg-[#ececec] border border-gray-300 rounded px-4 pr-9 text-sm text-gray-600 appearance-none">
                                <option>Select Event</option>
                            </select>
                            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value=""
                            readOnly
                            placeholder="Enter Callback URI"
                            className="h-10 bg-[#ececec] border border-gray-300 rounded px-4 text-sm text-gray-500"
                        />
                        <button className="h-8 w-8 inline-flex items-center justify-center text-[#4e627f] hover:text-[#2f3d50]">
                            <FiX size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotDetailsModal;
