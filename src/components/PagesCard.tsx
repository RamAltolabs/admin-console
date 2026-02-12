import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLayout, FiRefreshCw, FiExternalLink, FiSearch, FiUser, FiCalendar, FiClock, FiCheckCircle, FiInfo } from 'react-icons/fi';
import merchantService from '../services/merchantService';

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
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                            <FiLayout size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Landing Pages</h3>
                            <p className="text-sm text-gray-500 font-medium">Create and manage your campaign templates</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search pages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-100/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all w-full md:w-64"
                            />
                        </div>
                        <button
                            onClick={fetchPages}
                            className={`p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 ${loading ? 'animate-spin-slow text-indigo-500 bg-indigo-50' : ''}`}
                            title="Refresh"
                        >
                            <FiRefreshCw size={20} />
                        </button>
                        <button
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                        >
                            <FiPlus size={18} className="stroke-[3]" />
                            <span className="text-sm font-bold tracking-wide uppercase">New Page</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-2">
                {filteredPages.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                        {filteredPages.map((page, index) => (
                            <div key={page.pageId || index} className="p-5 hover:bg-indigo-50/30 rounded-2xl transition-all duration-300 group relative border border-transparent hover:border-indigo-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h4 className="font-bold text-gray-900 text-lg truncate" title={page.pageName}>
                                                {page.pageName || 'Unnamed Page'}
                                            </h4>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center border ${getStatusStyle(page.status)}`}>
                                                {getStatusIcon(page.status)}
                                                {page.status || 'Active'}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wider">
                                                {page.pageType || 'custom-template'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-5 text-gray-500 text-xs font-medium">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <FiUser className="text-indigo-400" size={14} />
                                                <span className="truncate max-w-[150px]">{page.createdBy || 'System'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <FiCalendar className="text-indigo-400" size={14} />
                                                <span>{page.createdDate ? new Date(page.createdDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-400">
                                                ID: {page.pageId}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                        <button className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 bg-white shadow-sm border border-gray-200 rounded-xl transition-all active:scale-95" title="Preview">
                                            <FiExternalLink size={18} />
                                        </button>
                                        <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-100 bg-white shadow-sm border border-gray-200 rounded-xl transition-all active:scale-95" title="Edit">
                                            <FiEdit2 size={18} />
                                        </button>
                                        <button className="p-3 text-gray-500 hover:text-rose-600 hover:bg-rose-100 bg-white shadow-sm border border-gray-200 rounded-xl transition-all active:scale-95" title="Delete">
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <div className="inline-flex justify-center items-center w-20 h-20 bg-indigo-50 text-indigo-400 rounded-3xl mb-6 shadow-inner">
                            <FiLayout size={36} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">No pages discovered</h4>
                        <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
                            {searchTerm ? `No results matching "${searchTerm}". Try a different term.` : "Your landing pages and templates will appear here once created."}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </div>

            {pages.length > 0 && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-medium">
                    <div>Showing {filteredPages.length} of {pages.length} pages</div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Live system
                    </div>
                </div>
            )}
        </div>
    );
};

export default PagesCard;

