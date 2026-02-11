import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUser, FiActivity, FiMapPin } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface VisitHistoryCardProps {
    merchantId: string;
    cluster?: string;
}

const VisitHistoryCard: React.FC<VisitHistoryCardProps> = ({ merchantId, cluster }) => {
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 20;

    // Date filter state
    const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        const fetchVisitHistory = async () => {
            setLoading(true);
            try {
                // Calculate date range based on selection
                const endDate = new Date();
                let startDate = new Date();

                if (dateRange === 'custom' && customStartDate && customEndDate) {
                    startDate = new Date(customStartDate);
                    endDate.setTime(new Date(customEndDate).getTime());
                } else if (dateRange === '7days') {
                    startDate.setDate(startDate.getDate() - 7);
                } else if (dateRange === '30days') {
                    startDate.setDate(startDate.getDate() - 30);
                } else if (dateRange === '90days') {
                    startDate.setDate(startDate.getDate() - 90);
                }

                console.log('[VisitHistoryCard] Fetching data for merchant:', merchantId);
                console.log('[VisitHistoryCard] Date range:', startDate.toISOString(), 'to', endDate.toISOString());
                const response = await merchantService.getRawVisitorsList(
                    merchantId,
                    currentPage,
                    pageSize,
                    cluster,
                    startDate.toISOString(),
                    endDate.toISOString()
                );

                console.log('[VisitHistoryCard] API Response:', response);

                // Handle different response structures
                let visitorData: any[] = [];
                if (Array.isArray(response)) {
                    visitorData = response;
                } else if (response && response.rawVisitors) {
                    // Primary structure from API
                    visitorData = response.rawVisitors;
                } else if (response && response.content) {
                    visitorData = response.content;
                } else if (response && response.data) {
                    visitorData = Array.isArray(response.data) ? response.data : [];
                }

                console.log('[VisitHistoryCard] Extracted visitors:', visitorData.length);
                setVisitors(visitorData);

                // Calculate total pages if pagination info is available
                if (response && response.totalVisitorPages) {
                    setTotalPages(response.totalVisitorPages);
                } else if (visitorData.length > 0) {
                    setTotalPages(Math.ceil(visitorData.length / pageSize));
                }
            } catch (err) {
                console.error('[VisitHistoryCard] Failed to fetch visit history:', err);
                setVisitors([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVisitHistory();
    }, [merchantId, cluster, currentPage, dateRange, customStartDate, customEndDate]);

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    const getVisitorName = (visitor: any) => {
        const contacts = visitor.contacts || visitor.contact;
        if (contacts) {
            const c = Array.isArray(contacts) ? contacts[0] : contacts;
            const fn = c?.firstName || c?.first_name || c?.FirstName || '';
            const ln = c?.lastName || c?.last_name || c?.LastName || '';
            if (fn || ln) return `${fn} ${ln}`.trim();
        }
        return visitor.referenceID?.substring(0, 8) || visitor.id || 'Unknown Visitor';
    };

    const getVisitorInitial = (visitor: any) => {
        const contacts = visitor.contacts || visitor.contact;
        if (contacts) {
            const c = Array.isArray(contacts) ? contacts[0] : contacts;
            const fn = c?.firstName || c?.first_name || c?.FirstName || '';
            if (fn) return fn.charAt(0).toUpperCase();
        }
        return visitor.referenceID?.substring(0, 1).toUpperCase() || 'V';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FiCalendar className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Visit History</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {dateRange === '7days' && 'Last 7 days of visitor activity'}
                                {dateRange === '30days' && 'Last 30 days of visitor activity'}
                                {dateRange === '90days' && 'Last 90 days of visitor activity'}
                                {dateRange === 'custom' && 'Custom date range'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setDateRange('7days')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${dateRange === '7days'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setDateRange('30days')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${dateRange === '30days'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Last 30 Days
                    </button>
                    <button
                        onClick={() => setDateRange('90days')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${dateRange === '90days'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Last 90 Days
                    </button>
                    <button
                        onClick={() => setDateRange('custom')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${dateRange === 'custom'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Custom Range
                    </button>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 ml-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Visitor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Channel
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Messages
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Last Accessed
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                    <span className="text-sm font-medium text-gray-400">Loading visit history...</span>
                                </td>
                            </tr>
                        ) : visitors.length > 0 ? (
                            visitors.map((visitor, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 border border-blue-100">
                                                {getVisitorInitial(visitor)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">
                                                    {getVisitorName(visitor)}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {visitor.contacts?.phone?.cell || 'No contact'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-700">
                                            {visitor.engagements?.[0]?.channel || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${visitor.visitorType === 'NEW' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                            }`}>
                                            {visitor.visitorType || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FiActivity size={14} className="text-emerald-500" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {visitor.totalMessages || 0} messages
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                                            <FiClock size={14} className="text-gray-400" />
                                            <span className="font-medium">
                                                {formatDate(visitor.lastAccessedDate || visitor.createdDate)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <FiCalendar className="text-gray-400" size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 mb-1">No Visit History</p>
                                        <p className="text-xs text-gray-500">No visitor data found for the last 30 days</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && visitors.length > 0 && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default VisitHistoryCard;
