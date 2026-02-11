import React, { useState, useEffect } from 'react';
import { FiBook, FiSearch, FiEye, FiActivity, FiCalendar } from 'react-icons/fi';
import { KnowledgeBase } from '../types/merchant';
import merchantService from '../services/merchantService';
import KnowledgeBaseViewModal from './KnowledgeBaseViewModal';

interface KnowledgeBasesCardProps {
    merchantId: string;
    cluster?: string;
}

const KnowledgeBasesCard: React.FC<KnowledgeBasesCardProps> = ({ merchantId, cluster }) => {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    const fetchKnowledgeBases = async (pageIdx: number) => {
        setLoading(true);
        try {
            const response = await merchantService.getKnowledgeBases(merchantId, pageIdx, 20, cluster);
            setKnowledgeBases(response.content || []);
            setTotalPages(response.totalPages || 0);
            setPage(pageIdx);
        } catch (error) {
            console.error('Error fetching knowledge bases:', error);
            setKnowledgeBases([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchKnowledgeBases(0);
        }
    }, [merchantId]);

    const handleViewKB = (kb: KnowledgeBase) => {
        setSelectedKB(kb);
        setIsModalOpen(true);
    };

    const filteredKBs = knowledgeBases.filter(item => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        const name = item.knowledgeBaseName || item.title || item.name || item.question || item.header || item.subject || '';
        const desc = item.knowledgeBaseDesc || item.content || item.description || item.answer || item.body || item.text || '';
        return (
            name.toLowerCase().includes(term) ||
            desc.toLowerCase().includes(term)
        );
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FiBook className="mr-2 text-genx-500" /> Knowledge Bases
                </h3>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search knowledge..."
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
                        <span className="ml-3 text-gray-600 font-medium">Loading knowledge...</span>
                    </div>
                ) : filteredKBs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 italic">No knowledge bases found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredKBs.map((kb, idx) => (
                            <div key={kb.id || idx} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-blue-200 transition-all flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">
                                        {kb.knowledgeBaseName || kb.title || kb.name || kb.question || kb.header || kb.subject || 'Knowledge Entry'}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${(kb.status || kb.category || kb.type || 'Active').toString().toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                                        {kb.status || kb.category || kb.type || 'Active'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed mb-3 flex-grow">
                                    {kb.knowledgeBaseDesc || kb.content || kb.description || kb.answer || kb.body || kb.text || 'No description provided.'}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                                    <div className="flex items-center">
                                        <FiCalendar className="mr-1" />
                                        {kb.updatedDate ? new Date(kb.updatedDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="flex items-center font-medium text-gray-500">
                                        <FiActivity className="mr-1 text-green-500" />
                                        {kb.aiTrainingStatus || 'Status Unknown'}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                                    <button
                                        onClick={() => handleViewKB(kb)}
                                        className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center px-3 py-1.5 rounded-lg transition-all shadow-sm"
                                    >
                                        <FiEye className="mr-1.5" /> View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                        <button
                            onClick={() => fetchKnowledgeBases(page - 1)}
                            disabled={page === 0}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => fetchKnowledgeBases(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <KnowledgeBaseViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                kb={selectedKB}
            />
        </div>
    );
};

export default KnowledgeBasesCard;
