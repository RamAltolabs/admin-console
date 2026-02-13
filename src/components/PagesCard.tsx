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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-50 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                                title="Refresh"
                            >
                                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button
                                className="flex items-center gap-2 px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
                            >
                                <FiPlus size={18} />
                                <span className="titlecase">New Page</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-2">
                {filteredPages.length > 0 ? (
                    <div className="grid grid-cols-1 gap-1">
                        {filteredPages.map((page, index) => (
                            <div key={page.pageId || index} className="p-5 hover:bg-gray-50 rounded-2xl transition-all duration-300 group relative border border-transparent hover:border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                                        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-900 hover:text-white transition-all shadow-sm border border-gray-100" title="Preview">
                                            <FiExternalLink size={16} />
                                        </button>
                                        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-900 hover:text-white transition-all shadow-sm border border-gray-100" title="Edit">
                                            <FiEdit2 size={16} />
                                        </button>
                                        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-gray-100" title="Delete">
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
        </div>
    );
};

export default PagesCard;

