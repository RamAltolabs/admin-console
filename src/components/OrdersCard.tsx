import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiRefreshCw, FiSearch, FiCalendar, FiUser, FiHash, FiCheckCircle, FiClock, FiXCircle, FiTruck } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface OrdersCardProps {
    merchantId: string;
    cluster?: string;
}

const OrdersCard: React.FC<OrdersCardProps> = ({ merchantId, cluster }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const pageCount = 50;

    // Date range state
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { start, end };
    });
    const [selectedPreset, setSelectedPreset] = useState('7d');

    const handlePresetChange = (preset: string) => {
        setSelectedPreset(preset);
        const end = new Date();
        const start = new Date();

        if (preset === '7d') start.setDate(end.getDate() - 7);
        else if (preset === '30d') start.setDate(end.getDate() - 30);
        else if (preset === '90d') start.setDate(end.getDate() - 90);

        setDateRange({ start, end });
        setPageIndex(0);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const startStr = dateRange.start.toISOString();
            const endStr = dateRange.end.toISOString();

            const response = await merchantService.getOrders(merchantId, cluster, startStr, endStr, pageIndex, pageCount);

            // Handle various response shapes
            const items = Array.isArray(response) ? response :
                response?.orders || response?.content || response?.data || response?.items || [];
            const total = response?.totalRecords || response?.totalElements || response?.total || (Array.isArray(items) ? items.length : 0);

            setOrders(Array.isArray(items) ? items : []);
            setTotalRecords(total);
        } catch (error) {
            setOrders([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [merchantId, cluster, dateRange, pageIndex]);

    const filteredOrders = orders.filter((order: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const orderId = (order.orderId || order.id || '').toString().toLowerCase();
        const customer = (order.customerName || order.customer || order.buyerName || '').toLowerCase();
        const status = (order.status || order.orderStatus || '').toLowerCase();
        return orderId.includes(query) || customer.includes(query) || status.includes(query);
    });

    const getStatusConfig = (order: any) => {
        const status = (order.status || order.orderStatus || 'unknown').toLowerCase();
        if (status.includes('complet') || status.includes('deliver') || status.includes('fulfill')) {
            return { label: 'Completed', color: 'bg-green-50 text-green-600', icon: FiCheckCircle };
        }
        if (status.includes('pend') || status.includes('process') || status.includes('confirm')) {
            return { label: 'Processing', color: 'bg-blue-50 text-blue-600', icon: FiClock };
        }
        if (status.includes('ship') || status.includes('transit')) {
            return { label: 'Shipped', color: 'bg-purple-50 text-purple-600', icon: FiTruck };
        }
        if (status.includes('cancel') || status.includes('refund') || status.includes('return')) {
            return { label: 'Cancelled', color: 'bg-red-50 text-red-600', icon: FiXCircle };
        }
        return { label: status.charAt(0).toUpperCase() + status.slice(1) || 'Unknown', color: 'bg-gray-100 text-gray-500', icon: FiHash };
    };

    const getAmount = (order: any) => {
        const amount = order.totalAmount || order.total || order.amount || order.orderTotal || order.grandTotal || 0;
        if (typeof amount === 'number') return `$${amount.toFixed(2)}`;
        if (typeof amount === 'string') return amount.startsWith('$') ? amount : `$${amount}`;
        return 'N/A';
    };

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '—';
        }
    };

    const totalPages = Math.ceil(totalRecords / pageCount);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-72">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        />
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
                        {totalRecords} order{totalRecords !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mb-4"></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <FiShoppingBag className="text-gray-300" size={28} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-600 mb-1">No Orders Found</h4>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                            {searchQuery
                                ? 'No orders match your search query.'
                                : `No orders in the last ${selectedPreset === '7d' ? '7 days' : selectedPreset === '30d' ? '30 days' : '90 days'}.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Order ID</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order: any, index: number) => {
                                    const statusConfig = getStatusConfig(order);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={order.orderId || order.id || index} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                                                        <FiShoppingBag size={12} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-800 font-mono">
                                                        #{order.orderId || order.id || index + 1}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <FiUser size={12} className="text-gray-400" />
                                                    <span className="text-xs font-medium text-gray-600 truncate max-w-[150px]">
                                                        {order.customerName || order.customer || order.buyerName || order.userName || 'Guest'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {formatDate(order.orderDate || order.createdDate || order.createDate || order.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-gray-800">
                                                    {getAmount(order)}
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
                {totalPages > 1 && (
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

export default OrdersCard;
