import React, { useState, useEffect } from 'react';
import { FiGlobe, FiMonitor, FiClock, FiMapPin, FiRefreshCw, FiAlertTriangle, FiFilter } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { formatDate, getValidDate } from '../utils/dateUtils';
import { RawVisitor, PageResponseRawVisitor } from '../types/merchant';


interface VisitorsCardProps {
    merchantId: string;
    cluster?: string;
}

const VisitorsCard: React.FC<VisitorsCardProps> = ({ merchantId, cluster }) => {
    const [visitors, setVisitors] = useState<RawVisitor[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const fetchVisitors = async (pageNum: number) => {
        setLoading(true);
        setError(null);
        try {
            const response: PageResponseRawVisitor = await merchantService.getRawVisitors(merchantId, pageNum, 10, cluster);
            // Handle both structure types if necessary, though Type definition suggests strict structure
            const content = response.content || [];
            setVisitors(content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setPage(pageNum);
        } catch (err) {
            console.error('Error fetching visitors:', err);
            setError('Failed to load visitor data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchVisitors(0);
        }
    }, [merchantId, cluster]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            fetchVisitors(newPage);
        }
    };

    if (loading && visitors.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FiGlobe size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Visitor Traffic</h3>
                        <p className="text-sm text-gray-500">
                            {totalElements > 0 ? `${totalElements} total visits` : 'Track user sessions and formatting'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchVisitors(page)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {/* Placeholder for future date filter */}
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        <FiFilter size={14} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 px-6 py-3 text-sm flex items-center gap-2 border-b border-red-100">
                    <FiAlertTriangle /> {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Visitor Info</th>
                            <th className="px-6 py-3">Location</th>
                            <th className="px-6 py-3">Device / Browser</th>
                            <th className="px-6 py-3">Last Visit</th>
                            <th className="px-6 py-3">Session</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visitors.length > 0 ? (
                            visitors.map((visitor, index) => (
                                <tr key={visitor.id || index} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 truncate max-w-[150px]" title={visitor.visitorId}>
                                            {(() => {
                                                const idStr = visitor.sessionId || visitor.sessionID || visitor.id || visitor.visitorId || '';
                                                if (idStr && idStr.includes('-')) {
                                                    return `visitor.${idStr.split('-')[0]}`;
                                                }
                                                return idStr ? `visitor.${idStr.substring(0, 8)}` : 'Anonymous';
                                            })()}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                            {visitor.ipAddress || 'Unknown IP'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <FiMapPin className="text-gray-400" size={12} />
                                            {visitor.location || 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FiMonitor className="text-gray-400" size={14} />
                                            <span className="text-gray-900">{visitor.device || 'Desktop'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {visitor.browser || 'Chrome'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <FiClock className="text-gray-400" size={12} />
                                            {visitor.visitedAt || visitor.lastAccessedDate ? `${formatDate(getValidDate(visitor.visitedAt || visitor.lastAccessedDate))} ${(() => {
                                                const d = getValidDate(visitor.visitedAt || visitor.lastAccessedDate);
                                                return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                            })()}` : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                        {visitor.sessionId ? visitor.sessionId.substring(0, 8) + '...' : '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="inline-flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full mb-3 text-gray-400">
                                        <FiGlobe size={24} />
                                    </div>
                                    <p>No visitor data available</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <span className="text-xs text-gray-500">
                        Page {page + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 0}
                            className="px-3 py-1 text-xs font-medium border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages - 1}
                            className="px-3 py-1 text-xs font-medium border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorsCard;
