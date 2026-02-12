import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiRefreshCw, FiCalendar, FiCreditCard, FiCheckCircle, FiXCircle, FiClock, FiSearch, FiShoppingCart, FiTag, FiFilter } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface PaymentDetailsCardProps {
    merchantId: string;
    cluster?: string;
}

const PaymentDetailsCard: React.FC<PaymentDetailsCardProps> = ({ merchantId, cluster }) => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pageIndex, setPageIndex] = useState(0);
    const pageCount = 10;

    // Date range state - consistent with OrdersCard
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(end.getDate() - 7);
        return { start, end };
    });
    const [selectedPreset, setSelectedPreset] = useState('7d');

    const handlePresetChange = (preset: string) => {
        setSelectedPreset(preset);
        const now = new Date();

        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        if (preset === '7d') {
            start.setDate(now.getDate() - 7);
        } else if (preset === '30d') {
            start.setDate(now.getDate() - 30);
        } else if (preset === '90d') {
            start.setDate(now.getDate() - 90);
        }

        setDateRange({ start, end });
    };

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const startStr = dateRange.start.toISOString();
            const endStr = dateRange.end.toISOString();

            const response = await merchantService.getPaymentDetails(merchantId, startStr, endStr, cluster);

            // Handle various response shapes
            const items = Array.isArray(response) ? response :
                response?.paymentDetails || response?.payments || response?.content || response?.data || response?.items || [];

            setPayments(Array.isArray(items) ? items : []);
        } catch (error) {
            console.error("Failed to fetch payments", error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [merchantId, cluster, dateRange]);

    const getStatusConfig = (payment: any) => {
        const status = (payment.statusMessage || payment.status || payment.paymentStatus || 'unknown').toString().toLowerCase();

        if (status.includes('success') || status.includes('paid') || status.includes('complet') || status.includes('captured')) {
            return { label: 'Success', color: 'bg-green-50 text-green-600', icon: FiCheckCircle };
        }
        if (status.includes('fail') || status.includes('declin') || status.includes('error')) {
            return { label: 'Failed', color: 'bg-red-50 text-red-600', icon: FiXCircle };
        }
        if (status.includes('pend') || status.includes('process')) {
            return { label: 'Processing', color: 'bg-blue-50 text-blue-600', icon: FiClock };
        }
        return { label: status.charAt(0).toUpperCase() + status.slice(1) || 'Unknown', color: 'bg-gray-100 text-gray-500', icon: FiCreditCard };
    };

    const filteredPayments = payments.filter((payment: any) => {
        const statusConfig = getStatusConfig(payment);
        const matchesStatus = statusFilter === 'all' || statusConfig.label.toLowerCase() === statusFilter.toLowerCase();

        if (!searchQuery) return matchesStatus;
        const query = searchQuery.toLowerCase();

        const txnId = (payment.transactionId || payment.txnId || payment.id || '').toString().toLowerCase();
        const orderId = (payment.orderNumber || payment.orderId || '').toString().toLowerCase();
        const status = (payment.statusMessage || payment.status || payment.paymentStatus || '').toString().toLowerCase();
        const method = (payment.gatewayId || payment.gatewayDesc || payment.paymentMethod || payment.method || '').toLowerCase();

        return matchesStatus && (txnId.includes(query) || orderId.includes(query) || status.includes(query) || method.includes(query));
    });

    const totalPages = Math.ceil(filteredPayments.length / pageCount);
    const paginatedPayments = filteredPayments.slice(pageIndex * pageCount, (pageIndex + 1) * pageCount);

    const getAmount = (payment: any) => {
        const amount = payment.amount || payment.totalAmount || 0;
        const currency = payment.currency || 'INR';

        // Simple currency formatting
        try {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency }).format(amount);
        } catch {
            return `${currency} ${Number(amount).toFixed(2)}`;
        }
    };

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit'
            });
        } catch {
            return '—';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-72">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="appearance-none pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-gray-600 font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="success">Success</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                        </select>
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
                        {[
                            { id: '7d', label: '7D' },
                            { id: '30d', label: '30D' },
                            { id: '90d', label: '90D' }
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetChange(preset.id)}
                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selectedPreset === preset.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                        Showing {Math.min(filteredPayments.length, pageIndex * pageCount + 1)}-{Math.min(filteredPayments.length, (pageIndex + 1) * pageCount)} of {filteredPayments.length} transactions
                    </span>
                    <button
                        onClick={fetchPayments}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mb-4"></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading payments...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <FiCreditCard className="text-gray-300" size={28} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-600 mb-1">No Payments Found</h4>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                            {searchQuery
                                ? 'No transactions match your search query.'
                                : `No payments recorded in the last ${selectedPreset === '7d' ? '7 days' : selectedPreset === '30d' ? '30 days' : '90 days'}.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Transaction ID</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Order Ref</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Method</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedPayments.map((payment: any, index: number) => {
                                    const statusConfig = getStatusConfig(payment);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={payment.id || index} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <FiDollarSign size={14} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-800 font-mono">
                                                            {payment.transactionId || payment.txnId || payment.id || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-gray-600 font-mono">
                                                    {payment.orderNumber || payment.orderId || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {formatDate(payment.createdTime || payment.transactionDate || payment.date || payment.createdDate || payment.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                                    {payment.gatewayId || payment.paymentMethod || payment.method || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {getAmount(payment)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusConfig.color}`}>
                                                    <StatusIcon size={10} />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                            Page {pageIndex + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                                disabled={pageIndex === 0}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPageIndex(pageIndex + 1)}
                                disabled={pageIndex >= totalPages - 1}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentDetailsCard;
