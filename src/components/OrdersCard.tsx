import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiRefreshCw, FiSearch, FiCalendar, FiUser, FiHash, FiCheckCircle, FiClock, FiXCircle, FiTruck, FiArrowRight, FiFilter, FiEye } from 'react-icons/fi';
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
    const [statusFilter, setStatusFilter] = useState('all');
    const pageCount = 50;

    // Date range state
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(end.getDate() - 7);
        return { start, end };
    });
    const [selectedPreset, setSelectedPreset] = useState('7d');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [showFilters, setShowFilters] = useState(false);

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

        console.log('Using Date Range:', start, end);
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

    const getStatusConfig = (order: any) => {
        const statusRaw = order.details?.paymentStatusDesc || order.details?.orderStatusDesc || order.status || order.orderStatus || 'unknown';
        const status = String(statusRaw).toLowerCase();

        if (status.includes('complet') || status.includes('deliver') || status.includes('fulfill') || status.includes('paid') || status.includes('success')) {
            return { label: 'Completed', color: 'bg-green-50 text-green-600', icon: FiCheckCircle };
        }
        if (status.includes('pend') || status.includes('process') || status.includes('confirm') || status.includes('init')) {
            return { label: 'Processing', color: 'bg-blue-50 text-blue-600', icon: FiClock };
        }
        if (status.includes('ship') || status.includes('transit')) {
            return { label: 'Shipped', color: 'bg-purple-50 text-purple-600', icon: FiTruck };
        }
        if (status.includes('cancel') || status.includes('refund') || status.includes('return') || status.includes('fail')) {
            return { label: 'Cancelled', color: 'bg-red-50 text-red-600', icon: FiXCircle };
        }
        return { label: status.charAt(0).toUpperCase() + status.slice(1) || 'Unknown', color: 'bg-gray-100 text-gray-500', icon: FiHash };
    };

    const filteredOrders = orders.filter((order: any) => {
        const statusConfig = getStatusConfig(order);
        const matchesStatus = statusFilter === 'all' || statusConfig.label.toLowerCase() === statusFilter.toLowerCase();

        if (!searchQuery) return matchesStatus;

        const query = searchQuery.toLowerCase();
        const orderId = (order.orderId || order.id || '').toString().toLowerCase();
        const customer = (order.customerName || order.customer || order.buyerName || '').toLowerCase();
        const statusRaw = order.details?.paymentStatusDesc || order.details?.orderStatusDesc || order.status || order.orderStatus || '';
        const status = String(statusRaw).toLowerCase();

        return matchesStatus && (orderId.includes(query) || customer.includes(query) || status.includes(query));
    });

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
            <div className="flex flex-col sm:flex-row sm:items-right justify-between gap-4 mb-2">
                <div className="flex items-right gap-3">
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

                    {/* Status Filter */}
                    <div className="relative">
                        <button
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiFilter size={16} />
                            {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase()}
                        </button>
                        {showFilters && (
                            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="text-[10px] font-black text-gray-400 titlecase tracking-widest mb-3">Filter by Status</div>
                                <div className="space-y-2">
                                    {['all', 'completed', 'processing', 'shipped', 'cancelled'].map(status => (
                                        <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                                            <input
                                                type="radio"
                                                name="statusFilter"
                                                value={status}
                                                checked={statusFilter === status}
                                                onChange={(e) => {
                                                    setStatusFilter(e.target.value);
                                                    setPageIndex(0);
                                                }}
                                                className="text-blue-900 focus:ring-blue-900 h-4 w-4"
                                            />
                                            <span className="text-sm text-gray-700 titlecase font-bold">
                                                {status === 'all' ? 'All Status' : status}
                                            </span>
                                        </label>
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
                        {filteredOrders.length} Results
                    </span>
                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm min-w-[120px] justify-center"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-transparent">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <div className="w-10 h-10 border-4 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-bold text-gray-400 titlecase tracking-widest">Loading orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                            <FiShoppingBag size={32} />
                        </div>
                        <h4 className="text-base font-bold text-gray-600 mb-1">No Orders Found</h4>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                            {searchQuery
                                ? 'No orders match your search query.'
                                : `No orders in the last ${selectedPreset === '7d' ? '7 days' : selectedPreset === '30d' ? '30 days' : '90 days'}.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredOrders.map((order: any, index: number) => {
                            const statusConfig = getStatusConfig(order);
                            const StatusIcon = statusConfig.icon;
                            const orderId = order.details?.orderNo || order.details?.id || order.id || index + 1;

                            return (
                                <div key={orderId} className="standard-tile flex-col items-stretch group relative gap-3 !p-4 bg-white hover:border-blue-900/30 transition-all duration-300 shadow-sm hover:shadow-md animate-in fade-in zoom-in-95 duration-300">
                                    {/* Header: ID and Status */}
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                                                <FiShoppingBag size={14} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-gray-900 tracking-tight">#{orderId}</h3>
                                                <p className="text-[9px] text-gray-400 font-black titlecase tracking-widest">
                                                    {formatDate(order.details?.order_creation_date || order.orderDate || order.createdDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black titlecase tracking-wider ${statusConfig.color}`}>
                                            <StatusIcon size={10} /> {statusConfig.label}
                                        </span>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="py-2.5 border-t border-b border-gray-50 flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-inner">
                                            <FiUser size={10} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 truncate">
                                            {(() => {
                                                const contact = order.customer?.contact;
                                                if (contact) {
                                                    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                                                    return name || 'Guest';
                                                }
                                                return order.customerName || order.userName || 'Guest';
                                            })()}
                                        </span>
                                    </div>

                                    {/* Footer: Amount */}
                                    <div className="mt-auto">
                                        <p className="text-[9px] text-gray-400 titlecase font-black tracking-widest">Grand Total</p>
                                        <p className="text-base font-black text-blue-900 tracking-tight">
                                            {(() => {
                                                const amount = order.details?.total_amount || order.details?.order_amount || order.totalAmount || 0;
                                                const currency = order.details?.currency || order.currency || 'INR';
                                                try {
                                                    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
                                                } catch {
                                                    return `${currency} ${amount}`;
                                                }
                                            })()}
                                        </p>
                                    </div>

                                    {/* Absolute Action Button */}
                                    <button
                                        onClick={() => setSelectedOrder(order)}
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                        <p className="text-[10px] font-black text-gray-400 titlecase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                            Page {pageIndex + 1} of {Math.ceil(filteredOrders.length / 50) || 1}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                                disabled={pageIndex === 0}
                                className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPageIndex(pageIndex + 1)}
                                disabled={pageIndex >= totalPages - 1}
                                className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                                <p className="text-xs text-gray-500">#{selectedOrder.details?.orderNo || selectedOrder.details?.id || selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiXCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-bold tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold titlecase ${getStatusConfig(selectedOrder).color}`}>
                                        {getStatusConfig(selectedOrder).label}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-bold tracking-wider mb-1">Amount</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {(() => {
                                            const amount = selectedOrder.details?.total_amount || selectedOrder.details?.order_amount || selectedOrder.totalAmount || 0;
                                            const currency = selectedOrder.details?.currency || selectedOrder.currency || 'INR';
                                            try {
                                                return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
                                            } catch {
                                                return `${currency} ${amount}`;
                                            }
                                        })()}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-bold tracking-wider mb-1">Date</p>
                                    <p className="text-xs font-semibold text-gray-700">{formatDate(selectedOrder.details?.order_creation_date || selectedOrder.createdDate)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 titlecase font-bold tracking-wider mb-1">Customer</p>
                                    <p className="text-xs font-semibold text-gray-700 truncate">
                                        {(() => {
                                            const contact = selectedOrder.customer?.contact;
                                            if (contact) {
                                                const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                                                return name || 'Guest';
                                            }
                                            return selectedOrder.customerName || selectedOrder.userName || 'Guest';
                                        })()}
                                    </p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FiShoppingBag className="text-blue-500" /> Order Items
                                </h3>
                                <div className="space-y-3">
                                    {(selectedOrder.details?.orderItems || selectedOrder.orderItems || []).map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 p-3 border border-gray-100 rounded-xl hover:border-blue-100 transition-colors">
                                            {item.menuItem?.image?.thumbnail1 && (
                                                <img
                                                    src={item.menuItem.image.thumbnail1}
                                                    alt={item.name}
                                                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-bold text-gray-800">{item.name || item.productName}</h4>
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: selectedOrder.details?.currency || 'INR' }).format(item.price)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description || item.menuItem?.description}</p>
                                                {item.quantity && <span className="text-[10px] font-bold text-gray-400 titlecase mt-2 block">Qty: {item.quantity}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedOrder.details?.orderItems && !selectedOrder.orderItems) && (
                                        <p className="text-xs text-gray-400 italic">No items details available.</p>
                                    )}
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FiUser className="text-blue-500" /> Customer Details
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                                    {selectedOrder.customer?.contact?.email_addresses?.[0] && (
                                        <div className="flex gap-2">
                                            <span className="text-xs font-bold text-gray-500 w-20">Email:</span>
                                            <span className="text-xs font-medium text-gray-800">{selectedOrder.customer.contact.email_addresses[0]}</span>
                                        </div>
                                    )}
                                    {selectedOrder.customer?.contact?.phone_numbers?.[0] && (
                                        <div className="flex gap-2">
                                            <span className="text-xs font-bold text-gray-500 w-20">Phone:</span>
                                            <span className="text-xs font-medium text-gray-800">{selectedOrder.customer.contact.phone_numbers[0]}</span>
                                        </div>
                                    )}
                                    {selectedOrder.customer?.contact?.city && (
                                        <div className="flex gap-2">
                                            <span className="text-xs font-bold text-gray-500 w-20">Location:</span>
                                            <span className="text-xs font-medium text-gray-800">{[selectedOrder.customer.contact.city, selectedOrder.customer.contact.state, selectedOrder.customer.contact.country].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersCard;
