import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser, FiGlobe, FiCpu, FiBook, FiActivity, FiMessageSquare, FiVolume2, FiMic, FiTarget, FiImage, FiLayers } from 'react-icons/fi';

interface AIAgentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: any) => Promise<void>;
    agent: any | null;
}

const AIAgentFormModal: React.FC<AIAgentFormModalProps> = ({ isOpen, onClose, onSave, agent }) => {
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (agent) {
            setFormData({
                ...agent,
                confidenceFactor: agent.confidenceFactor || 0.4,
                status: agent.status || 'Active',
                version: agent.version || '1.0',
                language: agent.language || 'en-US',
                gender: agent.gender || 'Male',
                responseSize: agent.responseSize || '100',
                emotion: agent.emotion || 'Empathetic',
            });
        }
    }, [agent]);

    if (!isOpen || !agent) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Ensure numeric fields are correctly typed
            const payload = {
                ...formData,
                confidenceFactor: parseFloat(formData.confidenceFactor),
                primaryKnowledgeBaseId: formData.primaryKnowledgeBaseId ? parseInt(formData.primaryKnowledgeBaseId) : null,
                secondaryKnowledgeBaseId: formData.secondaryKnowledgeBaseId ? parseInt(formData.secondaryKnowledgeBaseId) : null,
                primaryModelId: formData.primaryModelId ? parseInt(formData.primaryModelId) : null,
                secondaryModelId: formData.secondaryModelId ? parseInt(formData.secondaryModelId) : null,
                totalConversations: parseInt(formData.totalConversations || 0),
                totalCustomers: parseInt(formData.totalCustomers || 0),
            };
            await onSave(payload);
            onClose();
        } catch (error) {
            console.error('Error saving agent:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-900 text-white rounded-xl shadow-lg shadow-blue-200">
                            <FiUser size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-blue-900 tracking-tight">Edit AI Agent</h2>
                            <p className="text-xs font-medium text-gray-400">Configure agent identity, intelligence, and behavior</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-10">
                        {/* Basic Identity */}
                        <section>
                            <h3 className="text-[10px] font-black text-blue-900 titlecase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-blue-900/20 rounded-full"></span>
                                Identity & Core Info
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 titlecase tracking-widest mb-2 ml-1">Agent Name (Identifier)</label>
                                    <input
                                        type="text"
                                        name="identifier"
                                        value={formData.identifier || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 transition-all font-black text-blue-900"
                                        placeholder="e.g. Hamid"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 titlecase tracking-widest mb-2 ml-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status || 'Active'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 transition-all font-black text-blue-900"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2">Version</label>
                                    <input
                                        type="text"
                                        name="version"
                                        value={formData.version || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-900"
                                        placeholder="1.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender || 'Male'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-900"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Neutral">Neutral</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2">Language</label>
                                    <select
                                        name="language"
                                        value={formData.language || 'en-US'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-900"
                                    >
                                        <option value="en-US">English (US)</option>
                                        <option value="ar-SA">Arabic (SA)</option>
                                        <option value="es-MX">Spanish (MX)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2">Created By</label>
                                    <input
                                        type="text"
                                        name="createdBy"
                                        value={formData.createdBy || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all font-bold text-gray-900"
                                        placeholder="Author name"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Behavior & Persona */}
                        <section>
                            <h3 className="text-[10px] font-black text-blue-900 titlecase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-blue-900/20 rounded-full"></span>
                                Persona & Behavior
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2">Persona Type</label>
                                        <input
                                            type="text"
                                            name="persona"
                                            value={formData.persona || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all font-bold text-gray-900"
                                            placeholder="e.g. healthcare_administrator"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2">Emotion Tone</label>
                                        <input
                                            type="text"
                                            name="emotion"
                                            value={formData.emotion || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all font-bold text-gray-900"
                                            placeholder="e.g. Empathetic"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2">Confidence Factor (0-1)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            name="confidenceFactor"
                                            value={formData.confidenceFactor || 0.4}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all font-bold text-gray-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 titlecase tracking-tighter mb-2 flex items-center justify-between">
                                        System Prompt (Goal)
                                        <span className="text-[10px] text-indigo-400 normal-case font-medium">Use high-quality instructions for best performance</span>
                                    </label>
                                    <textarea
                                        name="goal"
                                        value={formData.goal || ''}
                                        onChange={handleChange}
                                        rows={8}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-700 text-sm leading-relaxed"
                                        placeholder="Detailed instructions for the AI behavior..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Knowledge & AI Models */}
                        <section>
                            <h3 className="text-[10px] font-black text-blue-900 titlecase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-blue-900/20 rounded-full"></span>
                                Intelligence Layer
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-gray-50/50 rounded-2xl border-2 border-gray-200 space-y-4 shadow-sm">
                                    <h4 className="text-[10px] font-black text-blue-900 titlecase tracking-widest flex items-center gap-2 mb-4"><FiBook className="text-blue-900" /> Primary Connectivity</h4>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 titlecase mb-1.5 ml-1">Knowledge Base ID</label>
                                        <input
                                            type="text"
                                            name="primaryKnowledgeBaseId"
                                            value={formData.primaryKnowledgeBaseId || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 titlecase mb-1.5 ml-1">AI Model ID</label>
                                        <input
                                            type="text"
                                            name="primaryModelId"
                                            value={formData.primaryModelId || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50/50 rounded-2xl border-2 border-gray-200 space-y-4 shadow-sm">
                                    <h4 className="text-[10px] font-black text-blue-900 titlecase tracking-widest flex items-center gap-2 mb-4"><FiLayers className="text-blue-900" /> Secondary Connectivity</h4>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 titlecase mb-1.5 ml-1">Knowledge Base ID</label>
                                        <input
                                            type="text"
                                            name="secondaryKnowledgeBaseId"
                                            value={formData.secondaryKnowledgeBaseId || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 titlecase mb-1.5 ml-1">AI Model ID</label>
                                        <input
                                            type="text"
                                            name="secondaryModelId"
                                            value={formData.secondaryModelId || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Media & Voice */}
                        <section>
                            <h3 className="text-[10px] font-black text-blue-900 titlecase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-blue-900/20 rounded-full"></span>
                                Voice & Media Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-gray-900 titlecase flex items-center gap-2 mb-4 ml-1"><FiVolume2 className="text-indigo-600" /> Text-to-Speech (TTS)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            name="textSpeechProvider"
                                            value={formData.textSpeechProvider || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700"
                                            placeholder="Provider (e.g. ELEVENLABS)"
                                        />
                                        <input
                                            type="text"
                                            name="textSpeechTone"
                                            value={formData.textSpeechTone || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700"
                                            placeholder="Voice Tone ID"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-gray-900 titlecase flex items-center gap-2 mb-4 ml-1"><FiMic className="text-indigo-600" /> Speech-to-Text (STT)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            name="speechTextProvider"
                                            value={formData.speechTextProvider || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700"
                                            placeholder="Provider (e.g. GOOGLE)"
                                        />
                                        <input
                                            type="text"
                                            name="speechTextTone"
                                            value={formData.speechTextTone || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700"
                                            placeholder="Model ID"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-900 titlecase flex items-center gap-2 mb-4 ml-1"><FiImage className="text-indigo-600" /> Agent Avatar URL</label>
                                    <input
                                        type="text"
                                        name="image"
                                        value={formData.image || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-indigo-600 truncate"
                                        placeholder="https://storage.googleapis.com/..."
                                    />
                                </div>
                            </div>
                        </section>
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
                        className="px-10 py-2.5 bg-blue-900 text-sm font-black text-white rounded-xl hover:bg-blue-900 transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:bg-blue-900/40 disabled:cursor-not-allowed border border-blue-900"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="titlecase">Syncing...</span>
                            </>
                        ) : (
                            <>
                                <FiSave />
                                <span className="titlecase tracking-wide">Sync Agent Details</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAgentFormModal;
