import React from 'react';
import { FiX, FiInfo, FiCalendar, FiUser, FiActivity, FiDatabase, FiHash, FiShield } from 'react-icons/fi';
import { KnowledgeBase } from '../types/merchant';

interface KnowledgeBaseViewModalProps {
    kb: KnowledgeBase | null;
    isOpen: boolean; onClose: () => void;
}

const KnowledgeBaseViewModal: React.FC<KnowledgeBaseViewModalProps> = ({ kb, isOpen, onClose }) => {
    if (!isOpen || !kb) return null;

    const details = [
        { label: 'Knowledge Base Name', value: kb.knowledgeBaseName || kb.title || 'N/A', icon: <FiInfo /> },
        { label: 'AI Training Status', value: kb.aiTrainingStatus || 'N/A', icon: <FiActivity />, color: 'text-green-600' },
        { label: 'Status', value: kb.status || 'N/A', icon: <FiShield />, color: kb.status === 'Active' ? 'text-green-600' : 'text-gray-600' },
        { label: 'Model Name', value: kb.modelName || 'N/A', icon: <FiDatabase /> },
        { label: 'Model ID', value: kb.modelId || 'N/A', icon: <FiHash /> },
        { label: 'Created By', value: kb.createdBy || 'N/A', icon: <FiUser /> },
        { label: 'Created On', value: kb.createdDate ? new Date(kb.createdDate).toLocaleString() : 'N/A', icon: <FiCalendar /> },
        { label: 'Updated Date', value: kb.updatedDate ? new Date(kb.updatedDate).toLocaleString() : 'N/A', icon: <FiCalendar /> },
        { label: 'ID', value: kb.id || 'N/A', icon: <FiHash /> },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">{kb.knowledgeBaseName || 'Knowledge Base Entry'}</h2>
                        <p className="text-blue-100 text-xs mt-1">Full configurations and metadata</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content (Left) */}
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Description / Content</h3>
                                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 min-h-[200px]">
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                                        {kb.knowledgeBaseDesc || kb.content || kb.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Raw Data Section */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Raw Metadata</h3>
                                <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto border border-gray-800 shadow-inner">
                                    <pre className="text-blue-300 font-mono text-xs leading-relaxed">
                                        {JSON.stringify(kb, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info (Right) */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Information</h3>
                            <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
                                {details.map((detail, index) => (
                                    <div key={index} className="flex flex-col space-y-1">
                                        <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            <span className="mr-1.5">{detail.icon}</span>
                                            {detail.label}
                                        </div>
                                        <div className={`text-sm font-medium ${detail.color || 'text-gray-900'} break-all`}>
                                            {detail.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBaseViewModal;
