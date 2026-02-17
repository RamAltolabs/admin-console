import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { KnowledgeBase } from '../types/merchant';
import merchantService from '../services/merchantService';

interface EditKnowledgeBaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    kb: KnowledgeBase | null;
    merchantId: string;
    cluster?: string;
    onSuccess: () => void;
}

const EditKnowledgeBaseModal: React.FC<EditKnowledgeBaseModalProps> = ({
    isOpen,
    onClose,
    kb,
    merchantId,
    cluster,
    onSuccess
}) => {
    const [formData, setFormData] = useState({
        knowledgeBaseName: '',
        knowledgeBaseDesc: '',
        modelId: '',
        vectorStorage: 'weaviate-db',
        artifactId: undefined as number | undefined
    });
    const [loading, setLoading] = useState(false);
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [loadingArtifacts, setLoadingArtifacts] = useState(false);

    useEffect(() => {
        if (kb) {
            setFormData({
                knowledgeBaseName: kb.knowledgeBaseName || kb.name || '',
                knowledgeBaseDesc: kb.knowledgeBaseDesc || kb.description || '',
                modelId: kb.modelId || '',
                vectorStorage: kb.vectorStorage || 'weaviate-db',
                artifactId: kb.artifactId
            });
        }
    }, [kb]);

    // Fetch artifacts when vector storage changes
    useEffect(() => {
        const fetchArtifacts = async () => {
            if (!merchantId || !formData.vectorStorage) return;

            setLoadingArtifacts(true);
            try {
                // Use search API for both and filter by provider
                const allArtifacts = await merchantService.searchAIArtifacts(merchantId, cluster);

                let filtered: any[] = [];
                if (formData.vectorStorage === 'weaviate-db') {
                    filtered = allArtifacts.filter((a: any) =>
                        a.provider === 'Weaviate' ||
                        a.provider?.toLowerCase().includes('weaviate')
                    );
                } else if (formData.vectorStorage === 'azure-ai-search') {
                    filtered = allArtifacts.filter((a: any) =>
                        a.provider === 'Microsoft Azure' ||
                        a.provider?.toLowerCase().includes('azure') ||
                        a.provider?.toLowerCase().includes('microsoft')
                    );
                }

                setArtifacts(filtered);
            } catch (error) {
                console.error('Error fetching artifacts:', error);
                setArtifacts([]);
            } finally {
                setLoadingArtifacts(false);
            }
        };

        fetchArtifacts();
    }, [formData.vectorStorage, merchantId, cluster]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!kb?.id) {
            alert('Knowledge Base ID is missing');
            return;
        }

        try {
            setLoading(true);
            await merchantService.updateKnowledgeBase(
                merchantId,
                kb.id,
                formData,
                cluster
            );
            alert('Knowledge Base updated successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating knowledge base:', error);
            alert('Failed to update Knowledge Base. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !kb) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-800">Edit Knowledge Base</h2>
                        <span className="text-sm text-gray-400">ℹ️</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Knowledge Base Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Knowledge Base <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.knowledgeBaseName}
                            onChange={(e) => setFormData({ ...formData, knowledgeBaseName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter knowledge base name"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={formData.knowledgeBaseDesc}
                            onChange={(e) => setFormData({ ...formData, knowledgeBaseDesc: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter description"
                        />
                    </div>

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Model <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.modelId}
                            onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            required
                        >
                            <option value="">Select Model</option>
                            <option value="1850">Model 1850</option>
                            {/* Add more model options as needed */}
                        </select>
                    </div>

                    {/* Vector Storage */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Vector Storage <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="vectorStorage"
                                    value="azure-ai-search"
                                    checked={formData.vectorStorage === 'azure-ai-search'}
                                    onChange={(e) => setFormData({ ...formData, vectorStorage: e.target.value })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Azure AI Search</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="vectorStorage"
                                    value="weaviate-db"
                                    checked={formData.vectorStorage === 'weaviate-db'}
                                    onChange={(e) => setFormData({ ...formData, vectorStorage: e.target.value })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Weaviate DB</span>
                            </label>
                        </div>
                    </div>

                    {/* Azure AI Search Dropdown (conditional) */}
                    {formData.vectorStorage === 'azure-ai-search' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Azure AI Search <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.artifactId || ''}
                                onChange={(e) => setFormData({ ...formData, artifactId: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                required
                                disabled={loadingArtifacts}
                            >
                                <option value="">
                                    {loadingArtifacts ? 'Loading...' : 'Select Azure AI Search'}
                                </option>
                                {artifacts.map((artifact) => (
                                    <option key={artifact.id} value={artifact.id}>
                                        {artifact.name || artifact.artifactName || `Artifact ${artifact.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Weaviate DB Dropdown (conditional) */}
                    {formData.vectorStorage === 'weaviate-db' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Weaviate DB <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.artifactId || ''}
                                onChange={(e) => setFormData({ ...formData, artifactId: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                required
                                disabled={loadingArtifacts}
                            >
                                <option value="">
                                    {loadingArtifacts ? 'Loading...' : 'Select Weaviate DB'}
                                </option>
                                {artifacts.map((artifact) => (
                                    <option key={artifact.id} value={artifact.id}>
                                        {artifact.name || artifact.artifactName || `Artifact ${artifact.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditKnowledgeBaseModal;
