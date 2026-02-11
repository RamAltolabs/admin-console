import React, { useState, useEffect } from 'react';
import { FiX, FiInfo, FiDatabase, FiCheckCircle } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface CreateKBModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchantId: string;
    cluster?: string;
    models: any[];
    onSuccess: () => void;
}

const CreateKBModal: React.FC<CreateKBModalProps> = ({
    isOpen, onClose, merchantId, cluster, models, onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedModelId, setSelectedModelId] = useState('');
    const [vectorStorageType, setVectorStorageType] = useState<'Azure' | 'Weaviate'>('Weaviate');
    const [selectedArtifactId, setSelectedArtifactId] = useState('');

    // Artifacts data
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [filteredArtifacts, setFilteredArtifacts] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchArtifacts();
        }
    }, [isOpen]);

    const fetchArtifacts = async () => {
        setLoading(true);
        try {
            const data = await merchantService.getAIArtifactsList(merchantId, cluster);
            setArtifacts(Array.isArray(data) ? data : (data.content || data.data || []));
        } catch (error) {
            console.error('Error fetching artifacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const providerMatch = vectorStorageType === 'Azure' ? 'Microsoft Azure' : 'Weaviate';
        const filtered = artifacts.filter(a => a.provider === providerMatch);
        setFilteredArtifacts(filtered);
        setSelectedArtifactId(''); // Reset selection when type changes
    }, [vectorStorageType, artifacts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !selectedModelId || !selectedArtifactId) {
            alert('Please fill in all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                merchantId,
                knowledgeBaseName: name,
                knowledgeBaseDesc: description,
                modelId: selectedModelId,
                artifactId: selectedArtifactId,
                vectorStorageType: vectorStorageType === 'Azure' ? 'AZURE_AI_SEARCH' : 'WEAVIATE_DB'
            };

            await merchantService.addKnowledgeBase(payload, cluster);
            alert('Knowledge Base created successfully!');
            onSuccess();
            onClose();
            // Reset form
            setName('');
            setDescription('');
            setSelectedModelId('');
            setSelectedArtifactId('');
        } catch (error) {
            console.error('Error creating KB:', error);
            alert('Failed to create Knowledge Base.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-[#1a365d] px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">Create Knowledge Base</h2>
                        <FiInfo size={16} className="text-indigo-200 cursor-help" />
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            <FiCheckCircle /> {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                        >
                            <FiX /> Cancel
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* KB Name */}
                    <div className="grid grid-cols-4 items-center">
                        <label className="text-sm font-bold text-gray-700 flex items-center">
                            Knowledge Base <span className="text-rose-500 ml-1 mt-1">*</span>
                        </label>
                        <div className="col-span-3">
                            <input
                                type="text"
                                placeholder="Test"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-4 items-center">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                            Description
                        </label>
                        <div className="col-span-3">
                            <input
                                type="text"
                                placeholder="Enter Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Model Dropdown */}
                    <div className="grid grid-cols-4 items-center">
                        <label className="text-sm font-bold text-gray-700 flex items-center">
                            Model <span className="text-rose-500 ml-1 mt-1">*</span>
                        </label>
                        <div className="col-span-3 relative">
                            <select
                                value={selectedModelId}
                                onChange={(e) => setSelectedModelId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                required
                            >
                                <option value="">Select Model</option>
                                {models.map(m => (
                                    <option key={m.modelId} value={m.modelId}>
                                        {m.modelName || m.identifier}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <FiX size={14} className="cursor-pointer hover:text-gray-600" onClick={() => setSelectedModelId('')} />
                            </div>
                        </div>
                    </div>

                    {/* Vector Storage Radio */}
                    <div className="grid grid-cols-4 items-center">
                        <label className="text-sm font-bold text-gray-700 flex items-center uppercase tracking-tight">
                            Vector Storage <span className="text-rose-500 ml-1 mt-1">*</span>
                        </label>
                        <div className="col-span-3 flex items-center gap-8">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="vectorType"
                                    checked={vectorStorageType === 'Azure'}
                                    onChange={() => setVectorStorageType('Azure')}
                                    className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Azure AI Search</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="vectorType"
                                    checked={vectorStorageType === 'Weaviate'}
                                    onChange={() => setVectorStorageType('Weaviate')}
                                    className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Weaviate DB</span>
                            </label>
                        </div>
                    </div>

                    {/* Dynamic DB/Artifact Dropdown */}
                    <div className="grid grid-cols-4 items-center">
                        <label className="text-sm font-bold text-gray-700 flex items-center uppercase tracking-tight">
                            {vectorStorageType === 'Azure' ? 'Azure AI Search' : 'Weaviate DB'} <span className="text-rose-500 ml-1 mt-1">*</span>
                        </label>
                        <div className="col-span-3 relative">
                            <select
                                value={selectedArtifactId}
                                onChange={(e) => setSelectedArtifactId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                                required
                                disabled={loading}
                            >
                                <option value="">{loading ? 'Loading...' : `Select ${vectorStorageType === 'Azure' ? 'Azure AI Search' : 'Weaviate DB'}`}</option>
                                {filteredArtifacts.map(a => (
                                    <option key={a.id || a.artifactId} value={a.id || a.artifactId}>
                                        {a.name || a.providerId || 'Unnamed Artifact'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </form>

                {/* Footer Message */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <FiDatabase size={16} />
                    </div>
                    <p className="text-xs text-gray-500">
                        Creating a Knowledge Base allows you to upload documents and train your AI models on specific datasets.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateKBModal;
