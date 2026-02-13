import React, { useState, useEffect } from 'react';
import { FiPackage, FiSearch, FiEye, FiActivity, FiCalendar } from 'react-icons/fi';
import { AIArtifact } from '../types/merchant';
import merchantService from '../services/merchantService';
import AIArtifactViewModal from './AIArtifactViewModal';

interface AIArtifactsCardProps {
    merchantId: string;
    cluster?: string;
}

const AIArtifactsCard: React.FC<AIArtifactsCardProps> = ({ merchantId, cluster }) => {
    const [artifacts, setArtifacts] = useState<AIArtifact[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArtifact, setSelectedArtifact] = useState<AIArtifact | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchArtifacts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await merchantService.getAIArtifactsList(merchantId, cluster);
            // The new API returns an array directly
            setArtifacts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching artifacts:', error);
            setError('Failed to load AI artifacts from the database.');
            setArtifacts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchArtifacts();
        }
    }, [merchantId]);

    const handleViewArtifact = (artifact: AIArtifact) => {
        setSelectedArtifact(artifact);
        setIsModalOpen(true);
    };

    const handleRefresh = () => {
        fetchArtifacts();
        setIsModalOpen(false);
    };

    const filteredArtifacts = artifacts.filter(item => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        return (
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.type && item.type.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term)) ||
            (item.provider && item.provider.toLowerCase().includes(term))
        );
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {error && (
                <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <FiPackage size={16} />
                    </div>
                    {error}
                </div>
            )}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FiPackage className="mr-2 text-genx-500" /> AI Artifacts
                </h3>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search artifacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-50/50 min-h-[200px]">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-genx-500"></div>
                        <span className="ml-3 text-gray-600 font-medium">Loading artifacts...</span>
                    </div>
                ) : filteredArtifacts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 italic">No AI artifacts found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredArtifacts.map((artifact) => (
                            <div key={artifact.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-blue-200 transition-all flex flex-col">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                        {artifact.icon?.url ? (
                                            <img src={artifact.icon.url} alt={artifact.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <FiPackage className="text-gray-400" size={20} />
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-sm text-gray-900 truncate pr-2">
                                                {artifact.name || 'Untitled Artifact'}
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex-shrink-0 ${artifact.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {artifact.status || 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 truncate">
                                            {artifact.provider || 'Internal'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <span className="text-[10px] font-bold text-genx-600 uppercase tracking-wider bg-genx-50 px-2 py-1 rounded">
                                        {artifact.type || 'Artifact'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-3 mb-3 flex-grow">
                                    {artifact.description}
                                </p>
                                <div className="mt-auto pt-3 border-t border-gray-50 flex justify-end">
                                    <button
                                        onClick={() => handleViewArtifact(artifact)}
                                        className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                                    >
                                        <FiEye /> View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AIArtifactViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                artifact={selectedArtifact}
                onUpdate={handleRefresh}
                onDelete={handleRefresh}
            />
        </div>
    );
};

export default AIArtifactsCard;
