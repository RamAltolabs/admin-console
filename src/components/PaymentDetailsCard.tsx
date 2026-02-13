import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiRefreshCw, FiCalendar, FiCreditCard, FiCheckCircle, FiXCircle, FiClock, FiSearch, FiShoppingCart, FiTag, FiFilter, FiEye, FiInfo } from 'react-icons/fi';
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
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
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
            return { label: 'Success', color: 'bg-emerald-50 text-emerald-600', icon: FiCheckCircle };
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
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
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                        />
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-sm min-w-[120px] justify-center"
                        >
                            <FiFilter size={14} />
                            {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                        </button>

                        {showStatusDropdown && (
                            <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="text-[10px] font-black text-gray-400 titlecase tracking-widest mb-2 px-1">Filter by Status</div>
                                <div className="space-y-1">
                                    {['all', 'success', 'processing', 'failed'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setShowStatusDropdown(false);
                                                setPageIndex(0);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${statusFilter === status
                                                ? 'bg-blue-50 text-blue-900'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {[
                            { id: '7d', label: '7D' },
                            { id: '30d', label: '30D' },
                            { id: '90d', label: '90D' }
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetChange(preset.id)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black titlecase tracking-widest transition-all duration-200 ${selectedPreset === preset.id
                                    ? 'bg-blue-900 text-white shadow-md'
                                    : 'text-gray-500 hover:text-blue-900 hover:bg-white'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-gray-100 px-2 py-1 rounded">
                        {filteredPayments.length} Results
                    </span>
                    <button
                        onClick={fetchPayments}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Payments List */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <div className="w-10 h-10 border-4 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-bold text-gray-400 titlecase tracking-widest">Loading payments...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {paginatedPayments.map((payment: any, index: number) => {
                            const statusConfig = getStatusConfig(payment);
                            const StatusIcon = statusConfig.icon;
                            const txnId = payment.transactionId || payment.txnId || payment.id || 'N/A';

                            return (
                                <div key={payment.id || index} className="standard-tile flex-col items-stretch group relative gap-3 !p-4 bg-white hover:border-blue-900/30 transition-all duration-300 shadow-sm hover:shadow-md animate-in fade-in zoom-in-95 duration-300">
                                    {/* Header: Icon and Status */}
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                                                <FiDollarSign size={14} />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-gray-900 tracking-tight font-mono truncate max-w-[100px]" title={txnId}>#{txnId}</h3>
                                                <p className="text-[9px] text-gray-400 font-black titlecase tracking-widest">
                                                    {formatDate(payment.createdTime || payment.transactionDate || payment.date || payment.createdTime)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black titlecase tracking-wider ${statusConfig.color}`}>
                                            <StatusIcon size={10} /> {statusConfig.label}
                                        </span>
                                    </div>

                                    {/* Content: Order Ref and Method */}
                                    <div className="space-y-2 py-2 border-y border-gray-50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-gray-400 titlecase tracking-widest uppercase">Order Ref</span>
                                            <span className="text-[10px] font-bold text-gray-700 font-mono">
                                                {payment.orderNumber || payment.orderId || '—'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-gray-400 titlecase tracking-widest uppercase">Method</span>
                                            <span className="text-[10px] font-black text-gray-600 titlecase">
                                                {payment.gatewayId || payment.paymentMethod || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer: Amount */}
                                    <div className="mt-auto">
                                        <p className="text-[9px] text-gray-400 titlecase font-black tracking-widest">Amount Paid</p>
                                        <p className="text-base font-black text-blue-900 tracking-tight">
                                            {getAmount(payment)}
                                        </p>
                                    </div>

                                    {/* Absolute Action Button */}
                                    <button
                                        onClick={() => setSelectedPayment(payment)}
                                        className="absolute bottom-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-900 hover:text-white transition-all duration-300 shadow-sm border border-gray-100 group-hover:shadow-md"
                                        title="View Details"
                                    >
                                        <FiEye size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-black text-blue-900 tracking-tight">Payment Details</h2>
                                <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest">Transaction Ref: {selectedPayment.transactionId || selectedPayment.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200"
                            >
                                <FiXCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-black tracking-widest mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold titlecase ${getStatusConfig(selectedPayment).color}`}>
                                        {React.createElement(getStatusConfig(selectedPayment).icon, { size: 12 })}
                                        {getStatusConfig(selectedPayment).label}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-black tracking-widest mb-1">Amount</p>
                                    <p className="text-base font-black text-blue-900">{getAmount(selectedPayment)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-black tracking-widest mb-1">Order Ref</p>
                                    <p className="text-xs font-bold text-gray-700 font-mono">{selectedPayment.orderNumber || selectedPayment.orderId || '—'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-black tracking-widest mb-1">Method</p>
                                    <p className="text-xs font-bold text-gray-700">{selectedPayment.gatewayId || selectedPayment.paymentMethod || '—'}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                                <h3 className="text-xs font-black text-blue-900 titlecase tracking-widest mb-3 flex items-center gap-2">
                                    <FiInfo size={14} /> Transaction Information
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 titlecase">Date</span>
                                        <span className="text-xs font-bold text-gray-700">{formatDate(selectedPayment.createdTime || selectedPayment.transactionDate || selectedPayment.date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 titlecase">Reference</span>
                                        <span className="text-xs font-bold text-gray-700 font-mono italic">{selectedPayment.transactionId || 'N/A'}</span>
                                    </div>
                                    {selectedPayment.gatewayDesc && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-gray-400 titlecase">Gateway</span>
                                            <span className="text-xs font-bold text-gray-700">{selectedPayment.gatewayDesc}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="px-6 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all shadow-md"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                        Page {pageIndex + 1} of {totalPages}
                    </p>
                    <button
                        onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                        disabled={pageIndex === 0}
                        className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={pageIndex >= totalPages - 1}
                        className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentDetailsCard;
