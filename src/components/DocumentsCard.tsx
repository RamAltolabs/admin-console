import React, { useState, useEffect } from 'react';
import { FiFolder, FiSearch, FiEdit2, FiTrash2, FiPlus, FiFilter, FiColumns, FiInfo, FiExternalLink, FiFileText, FiImage, FiFile } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import EditDocumentModal from './EditDocumentModal';

interface DocumentsCardProps {
    merchantId: string;
    cluster?: string;
}

const DocumentsCard: React.FC<DocumentsCardProps> = ({ merchantId, cluster }) => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [visibleColumns, setVisibleColumns] = useState({
        action: true,
        document: true,
        uri: true,
        documentType: true,
        fileType: true,
        knowledgeBase: true,
        createdDate: true,
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterKB, setFilterKB] = useState('');

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getDocuments(merchantId, page, pageSize, cluster);
            // Response structure: { documents: [...], totalElements: 9, totalPages: 1, ... }
            if (response && response.documents) {
                setDocuments(response.documents);
                setTotalElements(response.totalElements || 0);
                setTotalPages(response.totalPages || 0);
            } else {
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchDocuments();
        }
    }, [merchantId, cluster, page, pageSize]);

    const filteredDocuments = documents.filter(doc => {
        let matches = true;
        if (searchQuery) {
            const term = searchQuery.toLowerCase();
            const name = doc.documentName || doc.name || '';
            const kb = doc.knowledgeBaseName || '';
            matches = matches && (name.toLowerCase().includes(term) || kb.toLowerCase().includes(term));
        }
        if (filterKB) {
            const kb = doc.knowledgeBaseName || '';
            matches = matches && kb.toLowerCase().includes(filterKB.toLowerCase());
        }
        return matches;
    });

    const getFileIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('pdf')) return <FiFileText className="text-red-500" />;
        if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <FiImage className="text-purple-500" />;
        return <FiFile className="text-gray-400" />;
    };

    const handleDelete = async (doc: any) => {
        if (!window.confirm(`Are you sure you want to delete "${doc.documentName}"?`)) return;
        // logic for delete would go here, presumably a service call
        // For now just alert as the methods might not be in service yet
        alert('Delete functionality not yet implemented in service for documents.');
    };
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);

    const handleEdit = (doc: any) => {
        setSelectedDoc(doc);
        setEditModalOpen(true);
    };

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative" onClick={() => {
            // Close popovers when clicking outside
            if (showColumnSelector) setShowColumnSelector(false);
            // if (showFilters) setShowFilters(false); // filters might need interaction
        }}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white z-20 relative">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        Documents <FiInfo className="ml-2 text-gray-400" size={14} title="Manage vector store documents" />
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>

                    <div className="flex items-center gap-2 ml-1 relative">
                        <div className="relative">
                            <button
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                                title="Columns"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowColumnSelector(!showColumnSelector);
                                    setShowFilters(false);
                                }}
                            >
                                <FiColumns size={16} />
                                Columns
                            </button>
                            {/* Column Selector Popover */}
                            {showColumnSelector && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2" onClick={e => e.stopPropagation()}>
                                    <div className="text-xs font-bold text-gray-500 titlecase mb-2 px-2">Visible Columns</div>
                                    <div className="space-y-1">
                                        {Object.entries(visibleColumns).map(([key, isVisible]) => (
                                            <div key={key} className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer" onClick={() => toggleColumn(key as any)}>
                                                <input
                                                    type="checkbox"
                                                    checked={isVisible}
                                                    onChange={() => { }}
                                                    className="mr-2 h-3 w-3 text-blue-600 rounded border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
                                title="Filters"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFilters(!showFilters);
                                    setShowColumnSelector(false);
                                }}
                            >
                                <FiFilter size={16} />
                                Filters
                            </button>
                            {/* Filter Popover */}
                            {showFilters && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" onClick={e => e.stopPropagation()}>
                                    <div className="text-xs font-bold text-gray-500 titlecase mb-3">Filters</div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Knowledge Base</label>
                                            <input
                                                type="text"
                                                value={filterKB}
                                                onChange={(e) => setFilterKB(e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                                placeholder="Filter by KB name"
                                            />
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={() => {
                                                    setFilterKB('');
                                                    setShowFilters(false);
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-auto bg-gray-50/50 p-4">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No documents found.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 titlecase tracking-wider">
                                <tr>
                                    {visibleColumns.action && <th className="px-4 py-3 w-[80px]">Action</th>}
                                    {visibleColumns.document && <th className="px-4 py-3">Document</th>}
                                    {visibleColumns.uri && <th className="px-4 py-3">URI</th>}
                                    {visibleColumns.documentType && <th className="px-4 py-3">Document Type</th>}
                                    {visibleColumns.fileType && <th className="px-4 py-3">File Type</th>}
                                    {visibleColumns.knowledgeBase && <th className="px-4 py-3">Knowledge Base</th>}
                                    {visibleColumns.createdDate && <th className="px-4 py-3">Created Date</th>}
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredDocuments.map((doc, idx) => {
                                    const fileType = doc.documentParams?.docType || 'Unknown';
                                    const uri = doc.documentParams?.docLocation || '';
                                    return (
                                        <tr key={doc.documentId || idx} className="hover:bg-blue-50/30 transition-colors">
                                            {visibleColumns.action && (
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(doc)}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(doc)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.document && (
                                                <td className="px-4 py-3 font-medium text-blue-600 hover:underline cursor-pointer" title={doc.documentName}>
                                                    {doc.documentName}
                                                </td>
                                            )}
                                            {visibleColumns.uri && (
                                                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                                                    {uri ? (
                                                        <a href={uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-700 truncate">
                                                            {uri} <FiExternalLink size={10} />
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                            )}
                                            {visibleColumns.documentType && <td className="px-4 py-3 text-gray-500">{doc.documentType || '-'}</td>}
                                            {visibleColumns.fileType && (
                                                <td className="px-4 py-3 text-gray-500 flex items-center gap-2">
                                                    {getFileIcon(fileType)} {fileType}
                                                </td>
                                            )}
                                            {visibleColumns.knowledgeBase && <td className="px-4 py-3 text-gray-500">{doc.knowledgeBaseName || '-'}</td>}
                                            {visibleColumns.createdDate && (
                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                    {doc.createdDate ? new Date(doc.createdDate).toLocaleString() : '-'}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium titlecase ${(doc.status || 'Active') === 'Active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {doc.status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span>{filteredDocuments.length} of {totalElements} documents</span>
                        <div className="flex gap-1">
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                            >
                                &lt;
                            </button>
                            <span className="px-2 py-1">Page {page + 1} of {Math.max(1, totalPages)}</span>
                            <button
                                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {selectedDoc && (
                <EditDocumentModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedDoc(null);
                    }}
                    document={selectedDoc}
                    merchantId={merchantId}
                    cluster={cluster}
                    onUpdate={fetchDocuments}
                />
            )}
        </div>
    );
};

export default DocumentsCard;
