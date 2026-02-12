import React, { useState, useEffect, useMemo } from 'react';
import { FiUser, FiUserCheck, FiUserPlus, FiRefreshCw, FiTrash2, FiToggleLeft, FiToggleRight, FiLock, FiAlertTriangle, FiCheck, FiX, FiMail, FiClock, FiSettings, FiPower, FiSearch, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface UsersCardProps {
    merchantId: string;
    cluster?: string;
}

interface User {
    id: string | number;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    role: string;
    merchantId: string | number;
    modifiedTime?: string;
}

const UsersCard: React.FC<UsersCardProps> = ({ merchantId, cluster }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [serverTotalElements, setServerTotalElements] = useState(0);
    const [serverTotalPages, setServerTotalPages] = useState(0);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Invite User State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', role: 'ADMIN', authType: 'PG' });
    const [inviting, setInviting] = useState(false);

    const fetchUsers = async (pageIndex = 0, size = pageSize) => {
        setLoading(true);
        setError(null);
        try {
            const response = await merchantService.getUsers(merchantId, pageIndex, size, cluster);
            console.log('[UsersCard] fetchUsers response:', response);
            const userList = response.content || [];
            setUsers(userList);
            setPage(response.pageNumber);
            setServerTotalElements(response.totalElements || userList.length);
            setServerTotalPages(response.totalPages || 1);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchUsers(0, pageSize);
        }
    }, [merchantId, cluster, pageSize]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < effectiveTotalPages) {
            // If we have all data locally, just change page state
            if (filteredUsers.length > pageSize) {
                setPage(newPage);
            } else {
                fetchUsers(newPage, pageSize);
            }
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        fetchUsers(0, newSize);
    };

    // Client-side filtering logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = searchTerm === '' ||
                (user.userName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.email?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'ALL' ||
                (statusFilter === 'Active' ? user.status.toLowerCase() === 'active' : user.status.toLowerCase() !== 'active');

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    // Derived pagination values
    const effectiveTotalElements = useMemo(() => {
        // If filtered list is larger than page, use its length (means server returned all)
        // Otherwise use server total Elements (means server is paginating)
        return filteredUsers.length > pageSize ? filteredUsers.length : serverTotalElements;
    }, [filteredUsers, serverTotalElements, pageSize]);

    const effectiveTotalPages = useMemo(() => {
        return Math.ceil(effectiveTotalElements / pageSize);
    }, [effectiveTotalElements, pageSize]);

    // List of users that fit in the current page view
    const displayedUsers = useMemo(() => {
        // If we have more filtered users than page size, slice locally
        if (filteredUsers.length > pageSize) {
            const start = page * pageSize;
            return filteredUsers.slice(start, start + pageSize);
        }
        return filteredUsers;
    }, [filteredUsers, page, pageSize]);

    const handleToggleStatus = async (user: User) => {
        if (!window.confirm(`Are you sure you want to ${user.status === 'Active' ? 'deactivate' : 'activate'} this user?`)) return;

        setActionLoading(user.userName);
        setError(null);
        setSuccessMessage(null);

        try {
            const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
            // Create updated user object
            const updatedUser = { ...user, status: newStatus };
            await merchantService.updateUserAccount(updatedUser, cluster);

            // Optimistic update
            setUsers(users.map(u => u.userName === user.userName ? { ...u, status: newStatus } : u));
            setSuccessMessage(`User ${user.userName} status updated to ${newStatus}`);
        } catch (err) {
            console.error('Failed to update status:', err);
            setError('Failed to update user status');
            fetchUsers(); // Revert on failure
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async (userName: string) => {
        if (!window.confirm('Send password reset email to this user?')) return;

        setActionLoading(userName);
        setError(null);
        setSuccessMessage(null);

        try {
            await merchantService.resetPassword(userName, cluster);
            setSuccessMessage(`Password reset email sent to ${userName}`);
        } catch (err) {
            console.error('Failed to reset password:', err);
            setError('Failed to reset password');
        } finally {
            setActionLoading(null);
        }
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await merchantService.inviteUser(
                merchantId,
                inviteData.email,
                inviteData.role,
                inviteData.authType,
                cluster
            );
            setSuccessMessage(`Invitation sent to ${inviteData.email}`);
            setShowInviteModal(false);
            setInviteData({ email: '', role: 'ADMIN', authType: 'PG' });
            // Refresh list after a short delay
            setTimeout(fetchUsers, 1000);
        } catch (err) {
            console.error('Failed to invite user:', err);
            setError('Failed to send invitation. Please try again.');
        } finally {
            setInviting(false);
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <FiUser size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">User Management</h3>
                        <p className="text-sm text-gray-500">
                            {effectiveTotalElements > 0 ? `${effectiveTotalElements} total users` : 'Manage access, passwords, and status'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchUsers(page)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <FiUserPlus size={16} />
                        <span className="text-sm font-medium">Invite User</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-gray-50/50 border-b border-gray-100 p-4 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" size={14} />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg text-xs font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="USER">User</option>
                        <option value="SUPPORT">Support</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg text-xs font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('ALL');
                            setStatusFilter('ALL');
                        }}
                        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Notifications */}
            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-2 text-sm flex items-center gap-2 border-b border-red-100">
                    <FiAlertTriangle /> {error}
                    <button onClick={() => setError(null)} className="ml-auto hover:text-red-900"><FiX /></button>
                </div>
            )}
            {successMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-2 text-sm flex items-center gap-2 border-b border-green-100">
                    <FiCheck /> {successMessage}
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto hover:text-green-900"><FiX /></button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {displayedUsers.length > 0 ? (
                    displayedUsers.map((user, index) => {
                        const isProcessing = actionLoading === user.userName;
                        const isActive = user.status.toLowerCase() === 'active';

                        return (
                            <div key={user.id || index} className="col-span-1 bg-white border border-gray-100 rounded-lg p-3 hover:border-blue-100 hover:shadow-sm transition-all group flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium shrink-0 text-sm">
                                    {user.firstName ? user.firstName.charAt(0) : (user.userName ? user.userName.charAt(0).toUpperCase() : <FiUser />)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate" title={user.firstName ? `${user.firstName} ${user.lastName}` : user.userName}>
                                            {user.firstName} {user.lastName}
                                            {!user.firstName && !user.lastName && (user.userName || 'Unknown User')}
                                        </h4>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.status || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="bg-gray-50 border border-gray-100 px-1.5 rounded text-gray-600 font-medium whitespace-nowrap">
                                            {user.role || 'Member'}
                                        </span>
                                        <span className="truncate text-gray-400" title={user.email}>
                                            {user.email}
                                        </span>
                                        {user.modifiedTime && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-400 whitespace-nowrap" title={`Modified: ${user.modifiedTime}`}>
                                                    {new Date(user.modifiedTime).toLocaleDateString()}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleResetPassword(user.userName)}
                                        disabled={isProcessing}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Reset Password"
                                    >
                                        <FiLock size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(user)}
                                        disabled={isProcessing}
                                        className={`p-1.5 rounded-lg transition-colors ${isActive
                                            ? 'text-red-500 hover:bg-red-50'
                                            : 'text-green-600 hover:bg-green-50'}`}
                                        title={isActive ? "Deactivate User" : "Activate User"}
                                    >
                                        <FiPower size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 rounded-xl border border-dashed border-gray-100">
                        <FiUser size={40} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">No users found matching filters</p>
                        {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('ALL');
                                    setStatusFilter('ALL');
                                }}
                                className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        Showing <span className="text-gray-900 font-bold">{displayedUsers.length}</span> of <span className="text-gray-900 font-bold">{effectiveTotalElements}</span>
                    </span>
                    <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Per Page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-md text-[10px] font-black py-1 px-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 cursor-pointer shadow-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0 || loading}
                        className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                        title="Previous Page"
                    >
                        <FiChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-blue-600 px-3 py-1.5 bg-white border border-blue-100 rounded-lg shadow-sm min-w-[36px] text-center">
                            {page + 1}
                        </span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter px-0.5">of</span>
                        <span className="text-xs font-black text-gray-900 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm min-w-[36px] text-center">
                            {effectiveTotalPages || 1}
                        </span>
                    </div>

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= effectiveTotalPages - 1 || loading}
                        className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                        title="Next Page"
                    >
                        <FiChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FiUserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Invite New User</h3>
                                    <p className="text-xs text-gray-500">Send an invitation to join this merchant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInviteUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FiMail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={inviteData.email}
                                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={inviteData.role}
                                        onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm bg-white"
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="USER">User</option>
                                        <option value="SUPPORT">Support</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Auth Type
                                    </label>
                                    <select
                                        value={inviteData.authType}
                                        onChange={(e) => setInviteData({ ...inviteData, authType: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm bg-white"
                                    >
                                        <option value="PG">PG</option>
                                        <option value="GOOGLE">Google</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-2">
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md disabled:bg-blue-300 transform active:scale-[0.98]"
                                >
                                    {inviting ? (
                                        <>
                                            <FiRefreshCw className="animate-spin" size={18} />
                                            <span>Sending Invitation...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiUserPlus size={18} />
                                            <span>Send Invitation</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersCard;
