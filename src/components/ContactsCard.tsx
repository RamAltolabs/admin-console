import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiAlertCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface Customer {
    id?: string;
    contactFirstName?: string;
    contactLastName?: string;
    emailAddress?: string;
    phone?: string;
    role?: string;
    [key: string]: any;
}

interface ContactsCardProps {
    merchantId: string;
    cluster?: string;
}

const ContactsCard: React.FC<ContactsCardProps> = ({ merchantId, cluster }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Pagination states
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchContacts = async (page = pageIndex, forceRefresh = false) => {
        if (!merchantId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await merchantService.getContactsByMerchant(merchantId, cluster, page, pageSize, forceRefresh);
            console.log('[ContactsCard] fetchContacts response:', response);

            // API response might be different based on endpoint, 
            // usually it's { content: [], totalElements: 0, totalPages: 0 } or similar
            const contactsList = Array.isArray(response) ? response : (response.contacts || response.content || response.data || []);
            const total = response.totalElements || response.total || contactsList.length;
            const pages = response.totalPages || Math.ceil(total / pageSize);

            // Normalize contacts if needed
            const normalizedContacts = contactsList.map((item: any) => {
                const firstName = item.first_name || item.contactFirstName || item.firstName || '';
                const lastName = item.last_name || item.contactLastName || item.lastName || '';

                // Extract email from array if it exists
                let email = '';
                if (item.email_address && Array.isArray(item.email_address) && item.email_address.length > 0) {
                    email = item.email_address[0] || '';
                } else {
                    email = item.emailAddress || item.email || '';
                }

                // Extract phone from nested object in array if it exists
                let phone = '';
                if (item.phone_number && Array.isArray(item.phone_number) && item.phone_number.length > 0) {
                    const phoneObj = item.phone_number[0];
                    phone = phoneObj?.cell || phoneObj?.home || '';
                } else {
                    phone = item.phone || item.phoneNumber || '';
                }

                const role = item.role || item.merchantStatus || '';

                // Titlecase role for display
                const finalRole = role && role.length > 0 ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : '';

                return {
                    ...item,
                    contactFirstName: firstName,
                    contactLastName: lastName,
                    emailAddress: email,
                    phone: phone,
                    role: finalRole
                };
            });

            setCustomers(normalizedContacts);
            setTotalElements(total);
            setTotalPages(pages);
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
            setError('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchContacts(0);
            setPageIndex(0);
        }
    }, [merchantId, cluster]);

    const handleEditCustomer = (e: React.MouseEvent, customer: Customer) => {
        e.stopPropagation();
        setSelectedCustomer(customer);
        // In a real app, this would open an edit modal
        alert('Edit functionality would open here');
    };

    const handleDeleteCustomer = (e: React.MouseEvent, customer: Customer) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete customer "${customer.contactFirstName} ${customer.contactLastName}"?`)) {
            // In a real app, this would call merchantService.deleteContact
            alert('Delete functionality would trigger here');
        }
    };

    const handlePageChange = (newPageIndex: number) => {
        if (newPageIndex >= 0 && newPageIndex < totalPages) {
            setPageIndex(newPageIndex);
            fetchContacts(newPageIndex);
        }
    };

    if (loading && customers.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm min-h-[200px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm font-medium">Loading customer contacts...</p>
                </div>
            </div>
        );
    }

    if (error && customers.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm min-h-[200px] flex items-center justify-center">
                <div className="text-center text-red-500">
                    <FiAlertCircle size={24} className="mx-auto mb-2" />
                    <p className="font-medium">{error}</p>
                    <button
                        onClick={() => fetchContacts(pageIndex, true)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto"
                    >
                        <FiRefreshCw size={12} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <FiUser size={20} />
                        </span>
                        Customers
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-2">
                            {totalElements > 0 ? (
                                <>
                                    <span className="font-bold text-gray-900">{pageIndex * pageSize + 1}</span>
                                    <span className="mx-1">-</span>
                                    <span className="font-bold text-gray-900">{Math.min((pageIndex + 1) * pageSize, totalElements)}</span>
                                    <span className="mx-1.5 text-gray-400">of</span>
                                    <span className="font-bold text-gray-900">{totalElements}</span>
                                </>
                            ) : (
                                "0 Total"
                            )}
                        </span>
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchContacts(pageIndex, true)}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm"
                        title="Refresh Customers"
                    >
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {customers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <FiUser className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">No customers found</h3>
                    <p className="text-sm text-gray-500 mt-1">This merchant has no additional customers listed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customers.map((customer, index) => (
                        <div
                            key={index}
                            className="standard-tile group relative !p-4"
                        >
                            <div className="standard-tile-avatar !w-12 !h-12 !bg-purple-100 text-purple-600">
                                {(customer.contactFirstName || customer.contactLastName)
                                    ? (customer.contactFirstName?.[0] || '') + (customer.contactLastName?.[0] || '')
                                    : <FiUser size={20} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">
                                        {customer.contactFirstName} {customer.contactLastName}
                                    </h4>
                                    {customer.role && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold titlecase tracking-wider bg-purple-50 text-purple-700">
                                            {customer.role}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 text-xs text-gray-500">
                                    {customer.emailAddress && (
                                        <div className="flex items-center gap-1.5">
                                            <FiMail size={12} className="text-gray-400" />
                                            <span className="truncate">{customer.emailAddress}</span>
                                        </div>
                                    )}
                                    {customer.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <FiPhone size={12} className="text-gray-400" />
                                            <span className="truncate">{customer.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 opacity-100 transition-all shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}
                                    className="tile-btn-view h-7 w-7 flex items-center justify-center"
                                    title="View Customer"
                                >
                                    <FiEye size={12} />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteCustomer(e, customer)}
                                    className="tile-btn-delete h-7 w-7 flex items-center justify-center"
                                    title="Delete Customer"
                                >
                                    <FiTrash2 size={11} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6 col-span-1 md:col-span-2">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-bold text-gray-900">{pageIndex * pageSize + 1}</span> to <span className="font-bold text-gray-900">{Math.min((pageIndex + 1) * pageSize, totalElements)}</span> of <span className="font-bold text-gray-900">{totalElements}</span> customers
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pageIndex - 1)}
                                    disabled={pageIndex === 0}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Previous Page"
                                >
                                    <FiChevronLeft size={18} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        if (totalPages > 7) {
                                            if (i === 0 || i === totalPages - 1 || (i >= pageIndex - 2 && i <= pageIndex + 2)) {
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => handlePageChange(i)}
                                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${pageIndex === i ? 'bg-blue-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                );
                                            } else if (i === 1 || i === totalPages - 2) {
                                                return <span key={i} className="px-1 text-gray-400">...</span>;
                                            }
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${pageIndex === i ? 'bg-blue-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(pageIndex + 1)}
                                    disabled={pageIndex === totalPages - 1}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Next Page"
                                >
                                    <FiChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-in-center animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold">
                                    {(selectedCustomer.contactFirstName?.[0] || '') + (selectedCustomer.contactLastName?.[0] || '') || <FiUser />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedCustomer.contactFirstName} {selectedCustomer.contactLastName}</h3>
                                    {selectedCustomer.role && (
                                        <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">{selectedCustomer.role}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FiMail size={18} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 titlecase font-bold tracking-wider">Email Address</p>
                                            <p className="text-gray-900 font-medium">{selectedCustomer.emailAddress || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FiPhone size={18} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 titlecase font-bold tracking-wider">Phone Number</p>
                                            <p className="text-gray-900 font-medium">{selectedCustomer.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata Section */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiAlertCircle size={16} className="text-gray-400" />
                                        Advanced Metadata
                                    </h4>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Customer ID</span>
                                            <span className="text-gray-900 font-mono font-medium">{selectedCustomer.id || selectedCustomer.customerId || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Merchant ID</span>
                                            <span className="text-gray-900 font-medium">{selectedCustomer.merchantId || merchantId}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Created On</span>
                                            <span className="text-gray-900 font-medium">{selectedCustomer.createdDate || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Last Modified</span>
                                            <span className="text-gray-900 font-medium">{selectedCustomer.lastModifiedDate || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Deletion Status</span>
                                            <span className={`font-bold ${selectedCustomer.deleted ? 'text-red-500' : 'text-green-500'}`}>
                                                {selectedCustomer.deleted ? 'Deleted' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactsCard;
