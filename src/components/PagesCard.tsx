import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLayout, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface PagesCardProps {
    merchantId: string;
    cluster?: string;
}

interface Page {
    id: string;
    pageName?: string;
    pageTemplateName?: string;
    pageUrl?: string; // or url
    [key: string]: any;
}

const PagesCard: React.FC<PagesCardProps> = ({ merchantId, cluster }) => {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPages = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await merchantService.getMerchantPages(merchantId, cluster);
            setPages(Array.isArray(data) ? data : []);
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

    if (loading && pages.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-genx-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-genx-200 overflow-hidden">
            <div className="p-6 border-b border-genx-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiLayout size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Pages</h3>
                        <p className="text-sm text-gray-500">Manage landing pages</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchPages}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw size={18} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <FiPlus size={16} />
                        <span className="text-sm font-medium">Add Page</span>
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {pages.length > 0 ? (
                    pages.map((page, index) => (
                        <div key={page.id || index} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                            <div>
                                <h4 className="font-medium text-gray-900">{page.pageName || 'Unnamed Page'}</h4>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <span className="bg-gray-100 text-gray-600 px-1.5 rounded">{page.pageTemplateName}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {page.url && (
                                    <a href={page.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <FiExternalLink size={16} />
                                    </a>
                                )}
                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <FiEdit2 size={16} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center">
                        <div className="inline-flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full mb-3 text-gray-400">
                            <FiLayout size={24} />
                        </div>
                        <p className="text-gray-500 font-medium">No pages found</p>
                        <p className="text-sm text-gray-400 mt-1">Create pages for your campaigns</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PagesCard;
