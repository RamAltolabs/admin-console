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
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm transition-all hover:border-blue-900/30">
                            {agentImg ? (
                                <img src={agentImg} alt={agentTitle} className="w-full h-full object-cover" />
                            ) : (
                                <FiUser size={32} className="text-blue-300" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{agentTitle}</h2>
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black titlecase tracking-wider border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
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
                                <h3 className="text-[10px] font-black text-gray-400 titlecase tracking-widest mb-3 flex items-center gap-2">
                                    <FiActivity size={14} className="text-blue-900" /> Activity Stats
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 p-4 rounded-xl border-2 border-gray-200 text-center shadow-sm">
                                        <p className="text-2xl font-black text-blue-900 tracking-tight">{agent.totalConversations || 0}</p>
                                        <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest mt-1">Conversations</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-xl border-2 border-gray-200 text-center shadow-sm">
                                        <p className="text-2xl font-black text-blue-900 tracking-tight">{agent.totalCustomers || 0}</p>
                                        <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest mt-1">Customers</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black text-gray-400 titlecase tracking-widest mb-3 flex items-center gap-2">
                                    <FiInfo size={14} className="text-blue-900" /> Agent Details
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
                                <h3 className="text-[10px] font-black text-gray-400 titlecase tracking-widest mb-3 flex items-center gap-2">
                                    <FiClock size={14} className="text-blue-900" /> Timeline
                                </h3>
                                <div className="text-xs text-gray-500 font-medium py-3 px-4 bg-blue-50/50 rounded-xl border-2 border-blue-100 transition-all hover:bg-blue-50">
                                    <p className="mb-1 titlecase font-black text-[9px] text-blue-900 tracking-widest">Last Modified</p>
                                    <p className="text-gray-900 font-black text-sm tracking-tight">{agent.lastModifiedDate || 'N/A'}</p>
                                </div>
                            </section>
                        </div>

                        {/* Config Column */}
                        <div className="md:col-span-2 space-y-8">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-lg font-black text-blue-900 mb-6 flex items-center gap-3 tracking-tight">
                                    <FiLayers className="text-blue-900" /> Intelligence Layer
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {(agent.primaryKnowledgeBaseName || agent.secondaryKnowledgeBaseName) ? (
                                        <>
                                            {/* Primary Knowledge Base */}
                                            <div className="space-y-4">
                                                <div className="p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-200 hover:border-blue-900/30 transition-all shadow-sm">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                                                            <FiBook size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest leading-none">Primary Knowledge Base</p>
                                                            <h4 className="font-black text-blue-900 mt-2 truncate text-sm">{agent.primaryKnowledgeBaseName || 'None'}</h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-2 bg-white/50 px-2 py-1 rounded inline-block">Ref: {agent.primaryKnowledgeBaseId || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-200 hover:border-blue-900/30 transition-all shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                                                            <FiCpu size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest leading-none">Primary AI Model</p>
                                                            <h4 className="font-black text-blue-900 mt-2 text-sm">ID: {agent.primaryModelId || 'N/A'}</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Secondary Knowledge Base */}
                                            <div className="space-y-4">
                                                <div className="p-4 bg-gray-50/30 rounded-2xl border-2 border-gray-100 hover:border-blue-900/20 transition-all opacity-80 scale-[0.98]">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-gray-200 text-gray-600 rounded-lg text-opacity-40">
                                                            <FiDatabase size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-300 titlecase tracking-widest leading-none">Secondary Knowledge Base</p>
                                                            <h4 className="font-black text-gray-400 mt-2 truncate text-sm">{agent.secondaryKnowledgeBaseName || 'None'}</h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-gray-300 font-mono mt-2">Ref: {agent.secondaryKnowledgeBaseId || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50/30 rounded-2xl border-2 border-gray-100 hover:border-blue-900/20 transition-all opacity-80 scale-[0.98]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-gray-200 text-gray-600 rounded-lg text-opacity-40">
                                                            <FiCpu size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-300 titlecase tracking-widest leading-none">Secondary AI Model</p>
                                                            <h4 className="font-black text-gray-400 mt-2 text-sm">ID: {agent.secondaryModelId || 'N/A'}</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="sm:col-span-2 space-y-4">
                                            <div className="p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100 hover:border-blue-900/30 transition-all shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                                                        <FiBook size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest leading-none">Knowledge</p>
                                                        <h4 className="font-black text-blue-900 mt-2 text-sm">{agent.knowledge || agent.knowledgeBaseName || 'No Specific Knowledge Base Assigned'}</h4>
                                                    </div>
                                                </div>
                                                {(agent.knowledgeId || agent.knowledgeBaseId) && (
                                                    <p className="text-[10px] text-gray-400 font-mono mt-2 bg-white/50 px-2 py-1 rounded inline-block">Ref: {agent.knowledgeId || agent.knowledgeBaseId}</p>
                                                )}
                                            </div>
                                            <div className="p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                                                        <FiCpu size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest leading-none">Intelligence Engine</p>
                                                        <h4 className="font-black text-blue-900 mt-2 text-sm">Model: {agent.primaryModelId || agent.modelId || 'Default LLM'}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 shadow-sm">
                                <h4 className="text-[10px] font-black text-blue-900 mb-4 titlecase tracking-widest flex items-center gap-2">
                                    <FiGlobe size={16} /> Voice & Speech Config
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-4 bg-white/50 rounded-xl border border-blue-100 shadow-sm">
                                        <p className="text-[10px] font-black text-blue-900/40 titlecase tracking-widest mb-1.5">Text-to-Speech</p>
                                        <p className="text-sm font-black text-blue-900">{agent.textSpeechProvider || 'Default'}</p>
                                        <p className="text-[10px] text-blue-600/60 font-medium mt-1">{agent.textSpeechTone || 'Natural Tone'}</p>
                                    </div>
                                    <div className="p-4 bg-white/50 rounded-xl border border-blue-100 shadow-sm">
                                        <p className="text-[10px] font-black text-blue-900/40 titlecase tracking-widest mb-1.5">Speech-to-Text</p>
                                        <p className="text-sm font-black text-blue-900">{agent.speechTextProvider || 'Default'}</p>
                                        <p className="text-[10px] text-blue-600/60 font-medium mt-1">{agent.speechTextTone || 'Accurate Model'}</p>
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
                        className="px-8 py-2.5 bg-blue-900 text-sm font-bold text-white rounded-xl hover:bg-blue-800 transition-all shadow-md active:scale-95 border border-blue-900"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAgentViewModal;
