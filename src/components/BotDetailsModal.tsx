import React from 'react';
import { FiX, FiCpu, FiTag, FiLayers, FiActivity, FiGlobe, FiInfo, FiImage } from 'react-icons/fi';

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
    groupName?: string;
    rating?: string;
    features?: string;
    reference?: string;
    merchantRef?: string;
    [key: string]: any;
}

interface BotDetailsModalProps {
    bot: Bot | null;
    onClose: () => void;
}

const BotDetailsModal: React.FC<BotDetailsModalProps> = ({ bot, onClose }) => {
    if (!bot) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2" id="modal-title">
                                        <div className="p-1 rounded-lg inline-flex flex-shrink-0">
                                            <img
                                                src={bot.botImage1 || 'https://it-inferno.neocloud.ai/img/chatbot-template.png'}
                                                alt={bot.botTemplateName || 'Bot'}
                                                className="w-10 h-10 object-cover rounded-lg"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://it-inferno.neocloud.ai/img/chatbot-template.png'; }}
                                            />
                                        </div>
                                        {bot.botTemplateName || bot.title || 'Bot Details'}
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <span className="sr-only">Close</span>
                                        <FiX size={24} />
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column: Basic Info */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bot ID</label>
                                            <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">{bot.botId || bot.id}</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Internal Name</label>
                                            <p className="text-sm text-gray-900">{bot.botName || 'N/A'}</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(bot.status?.toLowerCase() || '') === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {bot.status || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Access</label>
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {bot.botAccess || 'Private'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Classification & Images */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Group</label>
                                            <p className="text-sm text-gray-900 flex items-center gap-1">
                                                <FiLayers className="text-gray-400" /> {bot.groupName || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</label>
                                            <p className="text-sm text-gray-900 flex items-center gap-1">
                                                <FiTag className="text-gray-400" /> {bot.type || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Merchant Ref</label>
                                            <p className="text-sm font-mono text-gray-500">{bot.merchantRef || bot.merchantId || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Full Width: Description */}
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                                        <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                                            {bot.description || 'No description provided.'}
                                        </div>
                                    </div>

                                    {/* Full Width: Images if available */}
                                    {(bot.botImage1 || bot.botImage2) && (
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Images</label>
                                            <div className="flex gap-4 overflow-x-auto pb-2">
                                                {bot.botImage1 && (
                                                    <img src={bot.botImage1} alt="Bot Image 1" className="h-32 w-auto object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                )}
                                                {bot.botImage2 && (
                                                    <img src={bot.botImage2} alt="Bot Image 2" className="h-32 w-auto object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Raw Data (Optional - Collapsible could be better but keeping simple for now) */}
                                    {/* <div className="md:col-span-2">
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">View Raw JSON</summary>
                                            <pre className="bg-gray-800 text-green-400 p-4 rounded mt-2 overflow-auto max-h-40">
                                                {JSON.stringify(bot, null, 2)}
                                            </pre>
                                        </details>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotDetailsModal;
