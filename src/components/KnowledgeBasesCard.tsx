import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFolder, FiEdit2, FiTrash2, FiFileText, FiArrowLeft, FiRefreshCw, FiPlus, FiInfo } from 'react-icons/fi';
import { KnowledgeBase } from '../types/merchant';
import merchantService from '../services/merchantService';
import KnowledgeBaseViewModal from './KnowledgeBaseViewModal';
import EditKnowledgeBaseModal from './EditKnowledgeBaseModal';

interface KnowledgeBasesCardProps {
    merchantId: string;
    cluster?: string;
    onDocumentsClick?: (kb: KnowledgeBase) => void;
}

const KnowledgeBasesCard: React.FC<KnowledgeBasesCardProps> = ({ merchantId, cluster, onDocumentsClick }) => {
    const [loading, setLoading] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(30); // Changed from const to useState, and initial value from 30
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]); // Renamed from kbs to knowledgeBases to match original
    const [docs, setDocs] = useState<any[]>([]); // New state
    const [viewState, setViewState] = useState<'kbs' | 'docs'>('kbs'); // New state
    const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null); // Kept original type
    const [filterText, setFilterText] = useState(''); // New state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null);

    const fetchKnowledgeBases = useCallback(async (pageIdx: number) => {
        setLoading(true);
        try {
            const response = await merchantService.getKnowledgeBases(merchantId, pageIdx, pageSize, cluster);
            setKnowledgeBases(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
            setPageIndex(pageIdx);
        } catch (error) {
            console.error('Error fetching knowledge bases:', error);
            setKnowledgeBases([]);
        } finally {
            setLoading(false);
        }
    }, [merchantId, pageSize, cluster]);

    useEffect(() => {
        if (merchantId) {
            fetchKnowledgeBases(0);
        }
    }, [merchantId, fetchKnowledgeBases]);


    const handleViewKB = (kb: KnowledgeBase) => {
        setSelectedKB(kb);
        setIsModalOpen(true);
    };

    const handleDeleteKB = async (kb: KnowledgeBase) => {
        if (!kb.id) {
            alert('Cannot delete: Knowledge Base ID is missing');
            return;
        }

        const kbName = kb.knowledgeBaseName || kb.name || 'this knowledge base';
        const confirmed = window.confirm(`Are you sure you want to delete "${kbName}"? This action cannot be undone.`);

        if (!confirmed) return;

        try {
            setLoading(true);
            await merchantService.deleteKnowledgeBase(merchantId, kb.id, cluster);

            // Refresh the list after successful deletion
            await fetchKnowledgeBases(pageIndex);

            // Show success message (you can replace with a toast notification)
            alert(`Successfully deleted "${kbName}"`);
        } catch (error) {
            console.error('Error deleting knowledge base:', error);
            alert(`Failed to delete "${kbName}". Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditKB = (kb: KnowledgeBase) => {
        setEditingKB(kb);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchKnowledgeBases(pageIndex);
    };

    const filteredKBs = knowledgeBases.filter(item => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        const name = item.knowledgeBaseName || item.title || item.name || '';
        const desc = item.knowledgeBaseDesc || item.description || '';
        const model = item.model || '';
        return (
            name.toLowerCase().includes(term) ||
            desc.toLowerCase().includes(term) ||
            model.toLowerCase().includes(term)
        );
    });

    const fetchDocuments = async (kbId: string) => {
        setLoading(true);
        try {
            const response = await merchantService.getDocuments(merchantId, 0, 1000, cluster);
            const allDocs = response.documents || response.content || response.data || [];

            const kbDocs = allDocs.filter((doc: any) => {
                // Ensure lenient matching
                const dKbId = String(doc.knowledgeBaseId || doc.kbId || doc.id || '');
                return dKbId === String(kbId);
            });

            setDocs(kbDocs);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentsClickInternal = (kb: KnowledgeBase) => {
        const resolvedKbId = String((kb as any).id || (kb as any).knowledgeBaseId || '');
        if (!resolvedKbId) return;
        if (onDocumentsClick) {
            onDocumentsClick(kb);
            return;
        }
        setSelectedKB(kb);
        setViewState('docs');
        fetchDocuments(resolvedKbId);
    };

    const handleBackToKBs = () => {
        setViewState('kbs');
        setSelectedKB(null);
        fetchKnowledgeBases(pageIndex);
    };

    const startIdx = pageIndex * pageSize + 1;
    const endIdx = Math.min((pageIndex + 1) * pageSize, totalElements);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {viewState === 'docs' && (
                        <button
                            onClick={handleBackToKBs}
                            className="mr-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <FiArrowLeft size={18} />
                        </button>
                    )}
                    <h3 className="text-lg font-bold text-gray-800">
                        {viewState === 'docs' ? `Documents for ${selectedKB?.knowledgeBaseName || selectedKB?.name || 'Knowledge Base'}` : 'Knowledge Base'}
                    </h3>
                    <FiInfo className="text-gray-400 cursor-help" size={14} />
                </div>
                {viewState === 'kbs' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <FiPlus size={16} /> Create Knowledge Base
                    </button>
                )}
                {viewState === 'docs' && (
                    <button className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2">
                        <FiPlus size={16} /> Add Document
                    </button>
                )}
            </div>

            {viewState === 'kbs' ? (
                <>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider w-20">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider">Knowledge Base</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider w-24">Documents</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider w-32">Model</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider w-32">Created By</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider w-40">Created Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider w-40">Updated Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 titlecase tracking-wider w-32">Training Status</th>
                                    <th className="px-4 py-3 w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="ml-3 text-gray-600 font-medium">Loading knowledge bases...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredKBs.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                                            No knowledge bases found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredKBs.map((kb, idx) => (
                                        <tr key={kb.id || idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditKB(kb)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteKB(kb)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => handleDocumentsClickInternal(kb)}>
                                                        {kb.knowledgeBaseName || kb.name || 'Untitled KB'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDocumentsClickInternal(kb)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors group"
                                                    title={`View ${kb.documentCount || 0} documents`}
                                                >
                                                    <FiFileText size={18} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-700 line-clamp-2">
                                                    {kb.knowledgeBaseDesc || kb.description || 'This knowledge is used for...'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-700">
                                                    {kb.model || 'NOC_Public_LLM'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-700">
                                                    {kb.createdBy || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">
                                                    {kb.createdDate ? new Date(kb.createdDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">
                                                    {(kb.updatedDate || kb.modifiedDate) ? new Date(kb.updatedDate || kb.modifiedDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${!kb.aiTrainingStatus || kb.aiTrainingStatus === 'NA' || kb.aiTrainingStatus === 'Not Trained' ? 'bg-gray-100 text-gray-500' : kb.aiTrainingStatus === 'Trained' || kb.aiTrainingStatus === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${!kb.aiTrainingStatus || kb.aiTrainingStatus === 'NA' || kb.aiTrainingStatus === 'Not Trained' ? 'bg-gray-400' : kb.aiTrainingStatus === 'Trained' || kb.aiTrainingStatus === 'Ready' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                                    {kb.aiTrainingStatus || 'Not Trained'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <div className="text-sm text-gray-600">
                            {totalElements > 0 ? `${startIdx} to ${endIdx} of ${totalElements}` : '0 to 0 of 0'}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Page {pageIndex + 1} of {totalPages || 1}</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fetchKnowledgeBases(0)}
                                    disabled={pageIndex === 0}
                                    className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                > ⟨⟨ </button>
                                <button
                                    onClick={() => fetchKnowledgeBases(pageIndex - 1)}
                                    disabled={pageIndex === 0}
                                    className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                > ⟨ </button>
                                <button
                                    onClick={() => fetchKnowledgeBases(pageIndex + 1)}
                                    disabled={pageIndex >= totalPages - 1}
                                    className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                > ⟩ </button>
                                <button
                                    onClick={() => fetchKnowledgeBases(totalPages - 1)}
                                    disabled={pageIndex >= totalPages - 1}
                                    className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                > ⟩⟩ </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Document Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Size</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {docs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No documents found for this knowledge base.
                                    </td>
                                </tr>
                            ) : (
                                docs.map((doc, idx) => (
                                    <tr key={doc.id || idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            <div className="flex items-center gap-2">
                                                <FiFileText className="text-gray-400" />
                                                {doc.fileName || doc.name || 'Untitled Document'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {doc.fileType || doc.type || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                                                doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {doc.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {doc.createdDate ? new Date(doc.createdDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <KnowledgeBaseViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                kb={selectedKB}
            />

            {editingKB && (
                <EditKnowledgeBaseModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingKB(null);
                    }}
                    kb={editingKB}
                    merchantId={merchantId}
                    cluster={cluster}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
};
export default KnowledgeBasesCard;
