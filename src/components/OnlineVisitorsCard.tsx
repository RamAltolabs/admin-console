import React, { useState, useEffect } from 'react';
import { FiUser, FiSmile, FiRefreshCw, FiGlobe } from 'react-icons/fi';
import { FaSignOutAlt } from 'react-icons/fa';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import merchantService from '../services/merchantService';

interface OnlineVisitorsCardProps {
    merchantId: string;
    cluster?: string;
    isEmbedded?: boolean;
}

const OnlineVisitorsCard: React.FC<OnlineVisitorsCardProps> = ({ merchantId, cluster, isEmbedded = false }) => {
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Calculate pagination values
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVisitors = visitors.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(visitors.length / itemsPerPage);

    const fetchVisitorList = async () => {
        setLoading(true);
        try {
            const webVisitorsRes = await merchantService.getWebVisitors(merchantId, cluster);
            setVisitors(Array.isArray(webVisitorsRes) ? webVisitorsRes : []);
        } catch (error) {
            console.error('Failed to fetch online visitors:', error);
            setVisitors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisitorList();
        const interval = setInterval(() => fetchVisitorList(), 10000);
        return () => clearInterval(interval);
    }, [merchantId, cluster]);

    return (
        <div className={isEmbedded ? "h-full flex flex-col" : "bg-white overflow-hidden h-full flex flex-col border border-gray-100 shadow-sm rounded-xl"}>
            {!isEmbedded && (
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <div className="relative">
                                <FiGlobe size={16} />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </div>
                        </div>
                        <h2 className="text-sm font-bold text-gray-800 titlecase tracking-wide">Online Visitors</h2>
                    </div>
                    <button
                        onClick={fetchVisitorList}
                        className="bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 px-3 py-1.5 shadow-sm"
                    >
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 titlecase tracking-wider">Visitor Name</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 titlecase tracking-wider">Agent</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 titlecase tracking-wider">Channel</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 titlecase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {currentVisitors.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                            <FiUser size={18} className="opacity-50" />
                                        </div>
                                        <p className="text-xs font-medium uppercase tracking-widest">No active visitors</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            currentVisitors.map((visitor, idx) => (
                                <tr key={visitor.id || idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100">
                                                {(() => {
                                                    const contacts = visitor.contacts || visitor.contact;
                                                    const c = Array.isArray(contacts) ? contacts[0] : contacts;
                                                    const session = visitor.session || visitor.sessionID || visitor.sessionId;
                                                    const firstChar = c?.firstName?.charAt(0) || c?.first_name?.charAt(0) || visitor.name?.charAt(0) || visitor.visitorName?.charAt(0) || session?.charAt(0) || visitor.id?.charAt(0) || 'V';
                                                    return firstChar.toUpperCase();
                                                })()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate max-w-[150px] transition-colors">
                                                    {(() => {
                                                        const contacts = visitor.contacts || visitor.contact;
                                                        let fn = '';
                                                        let ln = '';
                                                        if (contacts) {
                                                            const c = Array.isArray(contacts) ? contacts[0] : contacts;
                                                            fn = c?.firstName || c?.first_name || c?.FirstName || '';
                                                            ln = c?.lastName || c?.last_name || c?.LastName || '';
                                                        }
                                                        fn = fn || visitor.firstName || visitor.first_name || visitor.visitorName || visitor.name || '';
                                                        ln = ln || visitor.lastName || visitor.last_name || '';
                                                        const fullName = `${fn} ${ln}`.trim();
                                                        if (fullName) return fullName;

                                                        // Fallback to session ID (up to first hyphen) as requested
                                                        const session = visitor.session || visitor.sessionID || visitor.sessionId;
                                                        if (session) {
                                                            return `visitor.${session.split('-')[0]}`;
                                                        }

                                                        return visitor.id?.split('-')[0] || visitor.visitorId?.substring(0, 8) || 'Anonymous';
                                                    })()}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                                                        Online
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <FiSmile size={14} className="text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-600">
                                                {visitor.activeAgent ? 'Live Agent' : 'Bot Assistant'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-100">
                                            {visitor.engagements?.[0]?.channel || 'Website'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-gray-700">
                                                {visitor.totalConversations || 0} Msgs
                                            </span>
                                            <span className="text-[9px] font-medium text-gray-400 uppercase">
                                                {visitor.lastAccessedDate?.split(' ')[1] || 'Just now'}
                                            </span>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const sessionId = visitor.session || visitor.sessionID || visitor.sessionId;
                                                    if (!sessionId) return;

                                                    if (window.confirm('Are you sure you want to end this visitor session?')) {
                                                        try {
                                                            await merchantService.endVisitorSession(merchantId, sessionId, cluster);
                                                            // Refresh list after termination
                                                            fetchVisitorList();
                                                        } catch (err) {
                                                            console.error('Error ending session', err);
                                                        }
                                                    }
                                                }}
                                                title="End Session"
                                                className="mt-1 flex items-center justify-center p-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-500 border border-red-100 rounded-md transition-all shadow-sm group/btn"
                                            >
                                                <FaSignOutAlt size={12} className="group-hover/btn:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {visitors.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, visitors.length)} of {visitors.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`p-1.5 rounded-lg border border-gray-200 bg-white shadow-sm transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-300'}`}
                        >
                            <MdChevronLeft size={16} className="text-gray-600" />
                        </button>
                        <span className="text-xs font-bold text-gray-600">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`p-1.5 rounded-lg border border-gray-200 bg-white shadow-sm transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-300'}`}
                        >
                            <MdChevronRight size={16} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlineVisitorsCard;
