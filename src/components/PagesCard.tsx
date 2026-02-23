import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLayout, FiRefreshCw, FiExternalLink, FiSearch, FiUser, FiCalendar, FiClock, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import PageEditorModal from './PageEditorModal';
import { useAuth } from '../context/AuthContext';

interface PagesCardProps {
    merchantId: string;
    cluster?: string;
}

interface Page {
    pageId: string;
    pageName?: string;
    pageType?: string;
    pageTemplateId?: string;
    status?: string;
    createdBy?: string;
    createdDate?: string;
    content?: any[];
    [key: string]: any;
}

const PagesCard: React.FC<PagesCardProps> = ({ merchantId, cluster }) => {
    const { user } = useAuth();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewPage, setPreviewPage] = useState<Page | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchPages = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await merchantService.getMerchantPages(merchantId, cluster);
            // The API returns { mrchntPages: [{ pages: [...] }] }
            const mrchntPages = data?.mrchntPages || [];
            const allPages = mrchntPages.flatMap((mp: any) => mp.pages || []);
            setPages(allPages);
        } catch (err) {
            console.error('Error fetching pages:', err);
            setError('Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchPages();
        }
    }, [merchantId, cluster]);

    const filteredPages = useMemo(() => {
        return pages.filter(page =>
            (page.pageName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (page.pageType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (page.createdBy || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [pages, searchTerm]);

    const getStatusStyle = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'inactive':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
                return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return <FiCheckCircle size={10} className="mr-1" />;
            case 'pending':
                return <FiClock size={10} className="mr-1" />;
            case 'inactive':
                return <FiInfo size={10} className="mr-1" />;
            default:
                return null;
        }
    };

    const handleEditPage = (page: Page) => {
        setSelectedPage(page);
        setIsEditorOpen(true);
    };

    const handleSavePage = async (pageData: any) => {
        try {
            const isNewPage = pageData.pageId && String(pageData.pageId).toString().startsWith('temp-');

            // Construct payload structure based on provided curl command
            const payload = {
                version: "1.0",
                merchantID: merchantId,
                pages: [pageData]
            };

            if (isNewPage) {
                // For new pages, remove the temporary ID
                delete pageData.pageId;

                // Add required fields for creation
                pageData.createdDate = new Date().toISOString();
                pageData.createdBy = pageData.createdBy || user?.username || user?.email;
                if (!pageData.createdBy) {
                    showNotification('Unable to identify current user. Please log in again.', 'error');
                    return;
                }
                pageData.pageTemplateId = pageData.pageTemplateId || null;
                pageData.status = 'Active';

                await merchantService.createMerchantPage(payload, cluster);
                showNotification('Page created successfully!', 'success');
            } else {
                await merchantService.updateMerchantPage(payload, cluster);
                showNotification('Page updated successfully!', 'success');
            }

            await fetchPages(); // Refresh the list
        } catch (error: any) {
            console.error('Failed to save page:', error);
            const errorMessage = error?.response?.data?.description || error.message || 'Unknown error';
            showNotification(`Failed to save page: ${errorMessage}`, 'error');
        }
    };

    const handleCreateNewPage = () => {
        const newPage: Page = {
            pageId: `temp-${Date.now()}`,
            pageName: 'New Page',
            pageType: 'custom-template',
            status: 'Active',
            content: [],
        };
        setSelectedPage(newPage);
        setIsEditorOpen(true);
    };


    const handleDeletePage = async (page: Page) => {
        if (window.confirm(`Are you sure you want to delete the page "${page.pageName}"?`)) {
            setDeletingPageId(page.pageId);
            try {
                // Pass pageTemplateId as is (it will be string 'undefined' in URL if undefined, matching curl)
                // TS might complain if pageTemplateId is optional in Page but required in service.
                // merchantService expects string.
                await merchantService.deleteMerchantPage(
                    page.pageId,
                    page.pageTemplateId || 'undefined', // Fallback to string 'undefined' if missing, to be explicit
                    merchantId,
                    cluster
                );
                await fetchPages();
                showNotification(`Page "${page.pageName}" deleted successfully`, 'success');
            } catch (error: any) {
                console.error('Failed to delete page:', error);
                const errorMessage = error?.response?.data?.description || error.message || 'Unknown error';
                showNotification(`Failed to delete page: ${errorMessage}`, 'error');
            } finally {
                setDeletingPageId(null);
            }
        }
    };

    // Helper to extract thumbnail image from page content
    const getPageThumbnail = (page: Page): string | null => {
        // Check if page has a direct image URL
        if (page.pageTemplateId && page.pageTemplateId.startsWith('http')) {
            return page.pageTemplateId;
        }

        // Check content array for images
        if (Array.isArray(page.content)) {
            const imageElement = page.content.find((el: any) => el.type === 'image' && el.src);
            if (imageElement) {
                return imageElement.src;
            }
        }

        return null;
    };

    const handlePreviewPage = (page: Page) => {
        setPreviewPage(page);
        setIsPreviewOpen(true);
    };

    if (loading && pages.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-8 bg-gray-100 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-50 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                {/* Notification Toast */}
                {notification && (
                    <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold z-50 transition-all ${notification.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        } flex items-center gap-2 animate-fade-in-down`}>
                        {notification.type === 'success' ? <FiCheckCircle size={16} /> : <FiInfo size={16} />}
                        {notification.message}
                    </div>
                )}

                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl border border-blue-100">
                            <FiLayout size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-blue-900 tracking-tight">Landing Pages</h3>
                            <p className="text-xs font-medium text-gray-400">Create and manage your campaign templates</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-900 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search pages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900 transition-all w-full md:w-64"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-gray-100 px-2 py-1 rounded">
                                {filteredPages.length} Results
                            </span>
                            <button
                                onClick={fetchPages}
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                                title="Refresh"
                            >
                                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button
                                onClick={handleCreateNewPage}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors shadow-sm"
                            >
                                <FiPlus size={18} />
                                <span className="titlecase">New Page</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-2">
                    {filteredPages.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredPages.map((page, index) => {
                                const thumbnail = getPageThumbnail(page);
                                return (
                                    <div key={page.pageId || index} className="p-5 hover:bg-gray-50 rounded-2xl transition-all duration-300 group relative border border-transparent hover:border-gray-100">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Thumbnail Image */}
                                            {thumbnail && (
                                                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                                    <img
                                                        src={thumbnail}
                                                        alt={page.pageName || 'Page thumbnail'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <h4 className="font-bold text-gray-900 text-sm truncate" title={page.pageName}>
                                                        {page.pageName || 'Unnamed Page'}
                                                    </h4>
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black titlecase tracking-widest flex items-center border ${getStatusStyle(page.status).replace('emerald', 'emerald').replace('amber', 'amber').replace('indigo', 'blue')}`}>
                                                        {getStatusIcon(page.status)}
                                                        {page.status || 'Active'}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black text-gray-400 titlecase tracking-widest bg-gray-50 border border-gray-100">
                                                        {page.pageType || 'custom-template'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-5 text-gray-500 text-[10px] font-medium">
                                                    <div className="flex items-center gap-1.5 bg-gray-50/50 px-2 py-1 rounded-md border border-gray-100">
                                                        <FiUser className="text-blue-900/40" size={14} />
                                                        <span className="truncate max-w-[150px] titlecase">{page.createdBy || 'System'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-gray-50/50 px-2 py-1 rounded-md border border-gray-100">
                                                        <FiCalendar className="text-blue-900/40" size={14} />
                                                        <span>{page.createdDate ? new Date(page.createdDate).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                    <div className="text-[10px] font-mono text-gray-300">
                                                        Ref: {page.pageId}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handlePreviewPage(page)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-900 hover:text-white transition-all shadow-sm border border-gray-100"
                                                    title="Preview"
                                                >
                                                    <FiExternalLink size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditPage(page)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-900 hover:text-white transition-all shadow-sm border border-gray-100"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePage(page)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete"
                                                    disabled={deletingPageId === page.pageId}
                                                >
                                                    {deletingPageId === page.pageId ? (
                                                        <FiRefreshCw size={16} className="animate-spin text-red-600" />
                                                    ) : (
                                                        <FiTrash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <FiLayout className="text-gray-300" size={32} />
                            </div>
                            <h4 className="text-sm font-bold text-gray-600 mb-2">No Pages Discovered</h4>
                            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                                {searchTerm ? `No results matching "${searchTerm}". Try a different term.` : "Your landing pages and templates will appear here once created."}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-6 text-blue-900 font-black text-[10px] titlecase tracking-widest hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {pages.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                            Showing {filteredPages.length} of {pages.length} Pages
                        </p>
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-600 titlecase tracking-widest">Live System</span>
                        </div>
                    </div>
                )}
            </div >

            {/* Page Editor Modal */}
            {
                selectedPage && (
                    <PageEditorModal
                        isOpen={isEditorOpen}
                        onClose={() => {
                            setIsEditorOpen(false);
                            setSelectedPage(null);
                        }}
                        onSave={handleSavePage}
                        page={selectedPage}
                        merchantId={merchantId}
                    />
                )
            }

            {/* Preview Modal */}
            {
                isPreviewOpen && previewPage && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black text-blue-900 tracking-tight">Page Preview</h2>
                                        <p className="text-sm text-gray-500 mt-1">{previewPage.pageName || 'Unnamed Page'}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsPreviewOpen(false);
                                            setPreviewPage(null);
                                        }}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview Content */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                                    {(() => {
                                        // Render based on content type
                                        if (Array.isArray(previewPage.content) && previewPage.content.length > 0) {
                                            const firstContent = previewPage.content[0];

                                            // HTML content (landing pages)
                                            if (firstContent.data) {
                                                return <div dangerouslySetInnerHTML={{ __html: firstContent.data }} />;
                                            }

                                            // JSON template content
                                            if (firstContent.json) {
                                                try {
                                                    const jsonData = JSON.parse(firstContent.json);
                                                    return (
                                                        <div className="space-y-4">
                                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                                <p className="text-xs font-bold text-gray-600 mb-2">Template Type</p>
                                                                <p className="text-sm font-semibold text-blue-900">{jsonData.message?.type || 'Unknown'}</p>
                                                            </div>
                                                            {jsonData.message?.template && (
                                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                                    <p className="text-xs font-bold text-gray-600 mb-2">Message Template</p>
                                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{jsonData.message.template}</p>
                                                                </div>
                                                            )}
                                                            {jsonData.message?.footer && (
                                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                                    <p className="text-xs font-bold text-gray-600 mb-2">Footer</p>
                                                                    <p className="text-sm text-gray-800">{jsonData.message.footer}</p>
                                                                </div>
                                                            )}
                                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                                <p className="text-xs font-bold text-gray-600 mb-2">Raw JSON</p>
                                                                <pre className="text-xs text-gray-700 overflow-x-auto">{JSON.stringify(jsonData, null, 2)}</pre>
                                                            </div>
                                                        </div>
                                                    );
                                                } catch (e) {
                                                    return (
                                                        <div className="bg-red-50 p-4 rounded-lg">
                                                            <p className="text-sm text-red-600">Error parsing JSON content</p>
                                                            <pre className="text-xs text-red-800 mt-2 overflow-x-auto">{firstContent.json}</pre>
                                                        </div>
                                                    );
                                                }
                                            }

                                            // Visual builder content
                                            return (
                                                <div className="space-y-4">
                                                    {previewPage.content.map((element: any, index: number) => {
                                                        switch (element.type) {
                                                            case 'heading':
                                                                const HeadingTag = `h${element.level || 1}` as keyof JSX.IntrinsicElements;
                                                                return (
                                                                    <HeadingTag
                                                                        key={index}
                                                                        className={`font-bold ${element.level === 1 ? 'text-3xl' : element.level === 2 ? 'text-2xl' : 'text-xl'}`}
                                                                        style={{ textAlign: element.align || 'left' }}
                                                                    >
                                                                        {element.content}
                                                                    </HeadingTag>
                                                                );
                                                            case 'text':
                                                                return (
                                                                    <p key={index} style={{ textAlign: element.align || 'left' }}>
                                                                        {element.content}
                                                                    </p>
                                                                );
                                                            case 'image':
                                                                return element.src ? (
                                                                    <img
                                                                        key={index}
                                                                        src={element.src}
                                                                        alt={element.alt || 'Image'}
                                                                        className="rounded-lg max-w-full"
                                                                        style={{ width: element.width || '100%' }}
                                                                    />
                                                                ) : null;
                                                            case 'button':
                                                                return (
                                                                    <button
                                                                        key={index}
                                                                        className={`px-6 py-2 rounded-lg font-semibold ${element.style === 'primary'
                                                                            ? 'bg-blue-900 text-white'
                                                                            : element.style === 'secondary'
                                                                                ? 'bg-gray-200 text-gray-800'
                                                                                : 'border-2 border-blue-900 text-blue-900'
                                                                            }`}
                                                                    >
                                                                        {element.text}
                                                                    </button>
                                                                );
                                                            case 'divider':
                                                                return (
                                                                    <hr
                                                                        key={index}
                                                                        className={`my-4 ${element.style === 'solid'
                                                                            ? 'border-gray-300'
                                                                            : element.style === 'dashed'
                                                                                ? 'border-dashed border-gray-300'
                                                                                : 'border-dotted border-gray-300'
                                                                            }`}
                                                                    />
                                                                );
                                                            default:
                                                                return null;
                                                        }
                                                    })}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="text-center py-20">
                                                <FiInfo className="mx-auto text-gray-300 mb-4" size={48} />
                                                <h3 className="text-lg font-bold text-gray-600 mb-2">No Content Available</h3>
                                                <p className="text-sm text-gray-400">This page doesn't have any content to preview</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default PagesCard;
