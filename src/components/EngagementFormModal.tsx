import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiInfo, FiActivity, FiTag, FiUser, FiGlobe } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface EngagementFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: any) => Promise<void>;
    engagement: any | null;
    merchantId: string;
    cluster?: string;
}

const EngagementFormModal: React.FC<EngagementFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    engagement,
    merchantId,
    cluster
}) => {
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [aiAgents, setAiAgents] = useState<any[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(false);

    useEffect(() => {
        if (engagement) {
            setFormData({
                ...engagement,
                engagementId: engagement.engagementId || engagement.id,
            });
        }
    }, [engagement]);

    useEffect(() => {
        if (isOpen && merchantId) {
            fetchAgents();
        }
    }, [isOpen, merchantId]);

    const fetchAgents = async () => {
        setLoadingAgents(true);
        try {
            const data = await merchantService.getAIAgents(merchantId, cluster);
            setAiAgents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching AI agents:', error);
        } finally {
            setLoadingAgents(false);
        }
    };

    if (!isOpen || !engagement) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const agentId = e.target.value;
        const selectedAgent = aiAgents.find(a => a.id === agentId);

        if (selectedAgent) {
            setFormData((prev: any) => ({
                ...prev,
                aiAgent: {
                    id: selectedAgent.id,
                    name: selectedAgent.identifier || selectedAgent.name,
                    proactFlag: selectedAgent.proactFlag || false
                },
                // Some APIs expect uppercase AIAgent too
                AIAgent: {
                    ...selectedAgent
                }
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving engagement:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                            <FiGlobe size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Edit Engagement</h2>
                            <p className="text-sm text-gray-500 font-medium">Update channel settings and AI agent assignment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2">Engagement Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-bold text-gray-900"
                                    placeholder="e.g. Website Chatbot"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2">Status</label>
                                <select
                                    name="status"
                                    value={formData.status || 'Active'}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-gray-900"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2">ID (Read Only)</label>
                                <input
                                    type="text"
                                    value={formData.engagementId || ''}
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed"
                                    readOnly
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2">AI Agent Assignment</label>
                                <div className="relative">
                                    <select
                                        value={formData.aiAgent?.id || ''}
                                        onChange={handleAgentChange}
                                        disabled={loadingAgents}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-gray-900 appearance-none"
                                    >
                                        <option value="">Select an AI Agent</option>
                                        {aiAgents.map(agent => (
                                            <option key={agent.id} value={agent.id}>
                                                {agent.identifier || agent.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {loadingAgents ? (
                                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <FiUser className="text-gray-400" />
                                        )}
                                    </div>
                                </div>
                                <p className="mt-2 text-[10px] text-gray-400 font-medium italic">
                                    This agent will handle interactions for this engagement channel.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                            <FiInfo className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Updating an engagement immediately affects the live channel. Ensure your AI agent is properly trained before assignment.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-8 py-2.5 bg-indigo-600 text-sm font-bold text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <FiSave />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EngagementFormModal;
