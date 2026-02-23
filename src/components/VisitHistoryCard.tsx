import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUser, FiActivity, FiMapPin, FiRefreshCw } from 'react-icons/fi';
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
                endDate.setHours(23, 59, 59, 999); // End of today

                let startDate = new Date();
                startDate.setHours(0, 0, 0, 0); // Start of today

                if (dateRange === 'custom' && customStartDate && customEndDate) {
                    startDate = new Date(customStartDate);
                    startDate.setHours(0, 0, 0, 0);

                    const customEnd = new Date(customEndDate);
                    customEnd.setHours(23, 59, 59, 999);
                    endDate.setTime(customEnd.getTime());
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

        const idStr = visitor.sessionId || visitor.sessionID || visitor.id || visitor.visitorId || visitor.referenceID || '';
        if (idStr && idStr.includes('-')) {
            return `visitor.${idStr.split('-')[0]}`;
        }
        return idStr ? `visitor.${idStr.substring(0, 8)}` : 'Unknown Visitor';
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
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-900 border border-blue-100 shadow-sm">
                        <FiCalendar size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800 titlecase tracking-tight">Visit History</h3>
                        <p className="text-[10px] text-gray-400 font-black titlecase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                            {dateRange === '7days' && 'Last 7 Days'}
                            {dateRange === '30days' && 'Last 30 Days'}
                            {dateRange === '90days' && 'Last 90 Days'}
                            {dateRange === 'custom' && 'Custom Range'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-gray-100 px-2 py-1 rounded">
                        {visitors.length} Results
                    </span>
                    <button
                        onClick={() => {
                            setCurrentPage(0);
                            // fetchVisitHistory is triggered by dependencies, but we can call a manual refresh if we want.
                            // However, since it's in useEffect, updating a refresh state is cleaner.
                        }}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white border-b border-gray-100">
                {/* Date Filter */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {[
                            { id: '7days', label: '7D' },
                            { id: '30days', label: '30D' },
                            { id: '90days', label: '90D' },
                            { id: 'custom', label: 'Custom' }
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => {
                                    setDateRange(preset.id as any);
                                    setCurrentPage(0);
                                }}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black titlecase tracking-widest transition-all duration-200 ${dateRange === preset.id
                                    ? 'bg-blue-900 text-white shadow-md'
                                    : 'text-gray-500 hover:text-blue-900 hover:bg-white'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                            />
                            <span className="text-[10px] font-black text-gray-400 titlecase">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
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
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 titlecase tracking-wider">
                                Visitor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 titlecase tracking-wider">
                                Channel
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 titlecase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 titlecase tracking-wider">
                                Messages
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 titlecase tracking-wider">
                                Last Accessed
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                                        <p className="text-xs font-bold text-gray-400 titlecase tracking-widest">Loading visit history...</p>
                                    </div>
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
                                    <div className="flex flex-col items-center py-10">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                            <FiCalendar className="text-gray-300" size={28} />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-600 mb-1">No Visit History Found</h4>
                                        <p className="text-xs text-gray-400">No visitor data found for the selected range.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && visitors.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                        Page {currentPage + 1} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                            className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitHistoryCard;
