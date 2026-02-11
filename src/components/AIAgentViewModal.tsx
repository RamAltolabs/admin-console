import React from 'react';
import { FiX, FiUser, FiBook, FiCpu, FiGlobe, FiDatabase, FiActivity, FiLayers, FiInfo, FiClock, FiShield } from 'react-icons/fi';

interface AIAgentViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: any | null;
}

const AIAgentViewModal: React.FC<AIAgentViewModalProps> = ({ isOpen, onClose, agent }) => {
    if (!isOpen || !agent) return null;

    const agentTitle = agent.identifier || agent.agentName || 'AI Agent';
    const agentImg = (agent.agentImage && agent.agentImage[0]) || agent.image;
    const isActive = agent.status?.toUpperCase() === 'ACTIVE';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
                            {agentImg ? (
                                <img src={agentImg} alt={agentTitle} className="w-full h-full object-cover" />
                            ) : (
                                <FiUser size={32} className="text-indigo-300" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">{agentTitle}</h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {agent.status || 'N/A'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mt-1">Version {agent.version || '1.0'} • Created by {agent.createdBy || 'Unknown'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Summary Column */}
                        <div className="md:col-span-1 space-y-6">
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FiActivity size={14} className="text-indigo-500" /> Activity Stats
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <p className="text-2xl font-bold text-gray-900">{agent.totalConversations || 0}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Conversations</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <p className="text-2xl font-bold text-gray-900">{agent.totalCustomers || 0}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Customers</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FiInfo size={14} className="text-indigo-500" /> Agent Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium flex items-center gap-2 flex-shrink-0"><FiGlobe size={14} /> Language</span>
                                        <span className="text-gray-900 font-bold truncate ml-2 text-right">{agent.language || 'en-US'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium flex items-center gap-2 flex-shrink-0"><FiUser size={14} /> Gender</span>
                                        <span className="text-gray-900 font-bold ml-2">{agent.gender || 'Not Set'}</span>
                                    </div>
                                    {agent.confidenceFactor !== undefined && (
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                                            <span className="text-gray-500 font-medium flex items-center gap-2 flex-shrink-0"><FiShield size={14} /> Confidence</span>
                                            <span className="text-gray-900 font-bold ml-2">{agent.confidenceFactor * 100}%</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FiClock size={14} className="text-indigo-500" /> Timeline
                                </h3>
                                <div className="text-xs text-gray-500 font-medium py-3 px-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <p className="mb-1 uppercase font-bold text-[9px] text-indigo-400">Last Modified</p>
                                    <p className="text-gray-700 font-bold text-sm">{agent.lastModifiedDate || 'N/A'}</p>
                                </div>
                            </section>
                        </div>

                        {/* Config Column */}
                        <div className="md:col-span-2 space-y-8">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <FiLayers className="text-indigo-600" /> Intelligence Layer
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Primary Knowledge Base */}
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                                    <FiBook size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Primary Knowledge Base</p>
                                                    <h4 className="font-bold text-gray-900 mt-1 truncate">{agent.primaryKnowledgeBaseName || 'None'}</h4>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-mono mt-2">ID: {agent.primaryKnowledgeBaseId || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                                    <FiCpu size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Primary AI Model</p>
                                                    <h4 className="font-bold text-gray-900 mt-1">ID: {agent.primaryModelId || 'N/A'}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secondary Knowledge Base */}
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all opacity-80">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gray-200 text-gray-600 rounded-lg">
                                                    <FiDatabase size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Secondary Knowledge Base</p>
                                                    <h4 className="font-bold text-gray-900 mt-1 truncate">{agent.secondaryKnowledgeBaseName || 'None'}</h4>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-mono mt-2">ID: {agent.secondaryKnowledgeBaseId || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all opacity-80">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-200 text-gray-600 rounded-lg">
                                                    <FiCpu size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Secondary AI Model</p>
                                                    <h4 className="font-bold text-gray-900 mt-1">ID: {agent.secondaryModelId || 'N/A'}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-indigo-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <FiGlobe size={16} /> Voice & Speech Config
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Text-to-Speech</p>
                                        <p className="text-sm font-bold text-indigo-900">{agent.textSpeechProvider || 'Default'}</p>
                                        <p className="text-[11px] text-indigo-600 mt-0.5">{agent.textSpeechTone || 'Natural'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Speech-to-Text</p>
                                        <p className="text-sm font-bold text-indigo-900">{agent.speechTextProvider || 'Default'}</p>
                                        <p className="text-[11px] text-indigo-600 mt-0.5">{agent.speechTextTone || 'Accurate'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-sm font-bold text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAgentViewModal;
