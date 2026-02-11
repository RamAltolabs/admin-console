import React, { useState, useEffect, useRef } from 'react';
import {
    FiGlobe, FiMonitor, FiClock, FiMapPin, FiRefreshCw, FiAlertTriangle,
    FiFilter, FiUser, FiExternalLink, FiSearch, FiPhone, FiVideo,
    FiLogOut, FiSend, FiMessageSquare, FiChevronRight, FiChevronDown, FiActivity, FiTag, FiSmile
} from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface WebVisitorsCardProps {
    merchantId: string;
    cluster?: string;
    type: 'live-chat' | 'visit-history';
}

const WebVisitorsCard: React.FC<WebVisitorsCardProps> = ({ merchantId, cluster, type }) => {
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [activeDetailTab, setActiveDetailTab] = useState('summary');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial and Polling for Visitors
    const fetchVisitors = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const response = await merchantService.getWebVisitors(merchantId, cluster);
            const data = Array.isArray(response) ? response : [];

            setVisitors(prev => {
                // Determine if we should update the selected visitor object itself (keeping it fresh)
                if (selectedVisitor) {
                    const updatedSelected = data.find(v => v.sessionID === selectedVisitor.sessionID || v.id === selectedVisitor.id);
                    if (updatedSelected && JSON.stringify(updatedSelected) !== JSON.stringify(selectedVisitor)) {
                        setSelectedVisitor(updatedSelected);
                    }
                }
                return data;
            });

            if (data.length > 0 && !selectedVisitor) {
                setSelectedVisitor(data[0]);
            }
        } catch (err) {
            console.error(`Error fetching visitors: `, err);
            if (showLoading) setError(`Failed to load visitors list`);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Chat History Fetcher
    const fetchChatHistory = async (sessionId: string) => {
        try {
            const history = await merchantService.getChatHistory(sessionId, cluster);
            // Assuming history is an array of message objects { type: 'inbound'|'outbound', message, timestamp }
            const messages = Array.isArray(history) ? history : [];
            setChatHistory(messages);
        } catch (err) {
            console.error(`Error fetching chat history: `, err);
        }
    };

    // Visit History specific fetch
    const fetchHistory = async (pageIndex = 0) => {
        setLoading(true);
        try {
            const pageSize = 50;
            const response = await merchantService.getRawVisitorsList(merchantId, pageIndex, pageSize, cluster, startDate, endDate);

            // Handle rawVisitors response structure
            const data = response?.rawVisitors || (Array.isArray(response) ? response : []);

            console.log('[VisitHistory] Raw API Response:', response);
            if (data.length > 0) {
                console.log('[VisitHistory] First Visitor Data:', data[0]);
                console.log('[VisitHistory] First Visitor Agent:', data[0]?.agents?.[0]);
                console.log('[VisitHistory] First Visitor Engagement:', data[0]?.engagements?.[0]);
            }

            setVisitors(data);

            // Update pagination info
            // Assuming response structure contains these fields, otherwise fallback
            setPage(pageIndex);
            setTotalElements(response?.total || response?.totalElements || data.length);
            // Calculate total pages if not provided directly
            const calculatedTotalPages = response?.totalPages || Math.ceil((response?.total || data.length) / pageSize) || 1;
            setTotalPages(calculatedTotalPages);

        } catch (err) {
            console.error(`Error fetching visit history: `, err);
            setError(`Failed to load visit history`);
        } finally {
            setLoading(false);
        }
    };


    // Visit History State
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        if (merchantId) {
            if (type === 'visit-history') {
                fetchHistory();
            } else {
                fetchVisitors(true);
                const interval = setInterval(() => fetchVisitors(false), 5000);
                return () => clearInterval(interval);
            }
        }
    }, [merchantId, cluster, type]);

    if (type === 'visit-history') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FiClock size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Visit History</h3>
                            <p className="text-xs text-gray-500">Historical record of visitor sessions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <span className="text-xs text-gray-500 mr-2">From:</span>
                            <input
                                type="date"
                                className="text-xs border-none p-0 focus:ring-0 text-gray-600 outline-none"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <span className="text-xs text-gray-500 mr-2">To:</span>
                            <input
                                type="date"
                                className="text-xs border-none p-0 focus:ring-0 text-gray-600 outline-none"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => fetchHistory(0)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-2"
                        >
                            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Filter
                        </button>
                    </div>
                </div>

                {loading && visitors.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading History...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Visitor</th>
                                    <th className="px-6 py-4 w-16 text-center">Chat</th>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4 w-16 text-center">CSR</th>
                                    <th className="px-6 py-4">Access Date</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Engagement</th>
                                    <th className="px-6 py-4">Activity</th>
                                    <th className="px-6 py-4 text-center">Conversations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {visitors.length > 0 ? (
                                    visitors.map((v, i) => {
                                        const engagement = v.engagements?.[0];
                                        const agent = v.agents?.[0];
                                        const conversationCount = engagement?.allConversations?.length || 0;

                                        // Helper for Access Date
                                        const accessDate = v.lastAccessedDate_dt || v.createdDate || '-';

                                        return (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-700">
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-600">{v.contacts?.firstName || 'Guest'}</span>
                                                        <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1">
                                                            {v.contacts?.phone?.cell || 'No Phone'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <button
                                                            className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                                            title="View Chat"
                                                            disabled // Placeholder for now
                                                        >
                                                            <FiMessageSquare size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden">
                                                            {(agent?.imageUrl || agent?.profileUrl || agent?.avatarUrl) ? (
                                                                <img
                                                                    src={agent.imageUrl || agent.profileUrl || agent.avatarUrl}
                                                                    alt={agent.firstName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                agent?.type === 'AI' ? <span className="text-purple-600">AI</span> : (
                                                                    agent?.firstName?.charAt(0) || '?'
                                                                )
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-600">{agent?.firstName || 'Unassigned'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <FiSmile size={18} className="text-yellow-500 opacity-50" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                                                    {accessDate}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                        {v.visitorType || 'Visitor'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-xs">
                                                    {engagement?.channel || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {v.status || 'Past Visit'}
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-mono text-gray-500">
                                                    {conversationCount}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-24 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <FiClock size={32} className="opacity-20" />
                                                <p>No visit history found for this period</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                {!loading && visitors.length > 0 && (
                    <div className="border-t border-gray-100 p-3 bg-gray-50/50 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Showing <span className="font-medium">{visitors.length}</span> of <span className="font-medium">{totalElements}</span> visits
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchHistory(Math.max(0, page - 1))}
                                disabled={page === 0 || loading}
                                className={`p-1.5 rounded-md text-gray-500 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none`}
                                title="Previous Page"
                            >
                                <FiChevronDown className="transform rotate-90" size={16} />
                            </button>
                            <span className="text-xs font-medium text-gray-600">
                                Page {page + 1} of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => fetchHistory(page + 1)}
                                disabled={page >= (totalPages - 1) || loading}
                                className={`p-1.5 rounded-md text-gray-500 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none`}
                                title="Next Page"
                            >
                                <FiChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const filteredVisitors = visitors.filter(v => {
        const term = searchTerm.toLowerCase();
        const firstName = v.contacts?.firstName?.toLowerCase() || '';
        const lastName = v.contacts?.lastName?.toLowerCase() || '';
        const phone = v.contacts?.phone?.cell?.toLowerCase() || '';
        const sessionId = v.sessionID?.toLowerCase() || v.id?.toLowerCase() || '';
        return firstName.includes(term) || lastName.includes(term) || phone.includes(term) || sessionId.includes(term);
    });

    // Date formatter for chat
    const formatChatDate = (dateStr: string) => {
        if (!dateStr) return 'Just now';
        try {
            // Handle formats like "02-09-2026 11:06:39"
            const parts = dateStr.split(' ');
            if (parts.length === 2) {
                const dateParts = parts[0].split('-');
                if (dateParts.length === 3) {
                    // Try to reformat to YYYY-MM-DD for constructor
                    const d = new Date(`${dateParts[2]} -${dateParts[1]} -${dateParts[0]}T${parts[1]} `);
                    if (!isNaN(d.getTime())) {
                        return d.toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        });
                    }
                }
            }
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return dateStr;
        }
    };

    if (loading && visitors.length === 0) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Initializing Secure Chat Gateway...</p>
            </div>
        );
    }

    const currentEngagement = selectedVisitor?.engagements?.[0];

    return (
        <div className="flex h-[800px] bg-gray-100 rounded-xl overflow-hidden shadow-2xl border border-gray-200">
            {/* LEFT SIDEBAR: Visitor Overview */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-4xl font-black mb-4 shadow-inner ring-4 ring-white ring-offset-2 ring-offset-blue-100">
                            {selectedVisitor?.contacts?.firstName?.charAt(0) || 'V'}
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            {selectedVisitor?.contacts?.firstName || 'Anonymous'}
                            <span className={`w - 3 h - 3 rounded - full shadow - sm ring - 2 ring - white ${selectedVisitor?.blockVisitor ? 'bg-red-500' : 'bg-green-500 animate-pulse'} `}></span>
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {selectedVisitor?.contacts?.phone?.cell || 'No Phone Registered'}
                        </p>
                        <div className="flex gap-4 mt-6">
                            <button className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm border border-blue-100">
                                <FiVideo size={18} />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm border border-blue-100">
                                <FiPhone size={18} />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all transform hover:scale-110 shadow-sm border border-red-100">
                                <FiLogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-gray-50 px-2 bg-gray-50/30">
                    {['Summary', 'Profile', 'Action', 'History'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveDetailTab(tab.toLowerCase())}
                            className={`flex - 1 py - 4 text - [10px] font - black uppercase tracking - widest transition - all border - b - 2 ${activeDetailTab === tab.toLowerCase()
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                } `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {activeDetailTab === 'summary' && (
                        <>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Insights</h4>
                                <div className="space-y-3">
                                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all cursor-default">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-2"><FiClock className="group-hover:text-blue-500" /> Active Since</span>
                                            <span className="text-xs font-black text-gray-700">{selectedVisitor?.lastAccessedDate || 'Just Now'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all cursor-default">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-2"><FiRefreshCw className="group-hover:text-blue-500" /> Conversions</span>
                                            <span className="text-xs font-black text-gray-700">{selectedVisitor?.totalConversations || 1} Sessions</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all cursor-default">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-2"><FiMessageSquare className="group-hover:text-blue-500" /> Interactivity</span>
                                            <span className="text-xs font-black text-gray-700">{selectedVisitor?.totalMessages || 0} Total Msgs</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all cursor-default">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-2"><FiGlobe className="group-hover:text-blue-500" /> Origin</span>
                                            <span className="text-xs font-black text-gray-700">{currentEngagement?.channel || 'Website'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contextual Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentEngagement?.allConversations?.[0]?.context?.map((ctx: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm">
                                            {ctx}
                                        </span>
                                    )) || (
                                            <span className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-bold italic">No Discovery Insights</span>
                                        )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MIDDLE COLUMN: Chat Experience */}
            <div className="flex-1 flex flex-col bg-white border-r border-gray-200 relative">
                <div className="p-5 border-b border-gray-200 bg-blue-700 text-white flex items-center justify-between shadow-lg z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner">
                            <FiMessageSquare size={24} className="text-white fill-current opacity-80" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg leading-tight tracking-tight uppercase">
                                {selectedVisitor?.contacts?.firstName ? `${selectedVisitor.contacts.firstName} Console` : 'Visitor Dashboard'}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <p className="text-[9px] text-blue-100 uppercase font-black tracking-[0.1em]">{currentEngagement?.engagementName || 'Real-time Gateway'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {currentEngagement?.aiAgentImage?.map((img: string, i: number) => (
                                <img key={i} src={img} alt="Agent" className="w-8 h-8 rounded-full border-2 border-blue-700 shadow-md transform hover:scale-110 transition-all cursor-help" title={currentEngagement.aiAgent} />
                            ))}
                        </div>
                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10" title="Security Settings">
                            <FiActivity size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-gray-50 via-white to-gray-50 space-y-6">
                    {chatHistory.length > 0 ? (
                        chatHistory.map((msg, idx) => {
                            // Inbound are messages FROM the visitor (User), Outbound are from AI/Human Agent
                            const isUser = msg.type === 'inbound';
                            return (
                                <div key={idx} className={`flex flex - col ${isUser ? 'items-start' : 'items-end'} `}>
                                    <div className={`max - w - [70 %] px - 4 py - 2.5 rounded - xl shadow - sm ${isUser
                                        ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        : 'bg-[#43a1c9] text-white rounded-tr-none'
                                        } `}>
                                        <p className="text-[13px] leading-relaxed font-medium">{msg.text || msg.message}</p>
                                    </div>
                                    <span className={`text - [10px] text - gray - 400 mt - 1 italic ${isUser ? 'text-left' : 'text-right'} `}>
                                        {formatChatDate(msg.timestamp || msg.createdDate)}
                                    </span>
                                </div>
                            )
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
                                <FiMessageSquare size={48} className="opacity-10" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Synchronizing History...</p>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-5 border-t border-gray-100 bg-white/80 backdrop-blur-md z-10">
                    <div className="relative group flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                placeholder="Write your message here..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pr-14 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner hover:bg-white min-h-[56px] max-h-32 resize-none"
                                rows={2}
                            />
                            <div className="absolute right-4 bottom-4 flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-blue-600 transition-all rounded-lg hover:bg-blue-50">
                                    <FiTag size={16} />
                                </button>
                            </div>
                        </div>
                        <button className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 transform active:scale-90 group-hover:scale-105">
                            <FiSend size={22} className="relative -mr-1" />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR: Live Monitor */}
            <div className="w-80 flex flex-col bg-white shadow-2xl z-30">
                <div className="p-5 border-b border-gray-100 bg-cyan-700 text-white flex items-center justify-between">
                    <div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-xs">Live Visitors</h3>
                        <p className="text-[10px] text-cyan-200 font-bold uppercase mt-0.5">{visitors.length} Active Connections</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchVisitors(true)}
                            className="p-1 hover:bg-cyan-600 rounded-full transition-colors"
                            title="Refresh Visitors"
                        >
                            <FiRefreshCw size={16} className={`${loading ? 'animate-spin' : 'hover:rotate-180 transition-all duration-700'}`} />
                        </button>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="relative group">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Monitor specific visitor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredVisitors.length > 0 ? (
                        filteredVisitors.map((visitor) => {
                            const isSelected = selectedVisitor?.id === visitor.id || selectedVisitor?.sessionID === visitor.sessionID;
                            const currentEng = visitor.engagements?.[0];
                            const activeAgentId = visitor.activeAgent && visitor.activeAgent !== "0";

                            return (
                                <div
                                    key={visitor.id || visitor.sessionID}
                                    onClick={() => setSelectedVisitor(visitor)}
                                    className={`p - 5 border - b border - gray - 50 cursor - pointer transition - all relative group flex items - start gap - 4 ${isSelected
                                        ? 'bg-blue-50/80 border-l-[6px] border-l-blue-600'
                                        : 'hover:bg-gray-50 border-l-[6px] border-l-transparent'
                                        } `}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w - 14 h - 14 rounded - 2xl flex items - center justify - center text - gray - 700 font - black text - xl shadow - md transition - all ${isSelected ? 'bg-white ring-2 ring-blue-400 scale-105' : 'bg-gray-100 group-hover:bg-white'
                                            } `}>
                                            {visitor.contacts?.firstName?.charAt(0) || 'V'}
                                        </div>
                                        <div className={`absolute - bottom - 1 - right - 1 w - 5 h - 5 border - 4 border - white rounded - full shadow - sm ${visitor.blockVisitor ? 'bg-red-500' : 'bg-green-500 animate-pulse'} `}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font - bold text - sm truncate flex items - center gap - 1.5 ${isSelected ? 'text-blue-700' : 'text-gray-700'} `}>
                                                {visitor.contacts?.firstName || 'Anonymous'}
                                                <span className="text-[10px] text-gray-400 font-medium">{visitor.totalMessages || 0}</span>
                                                <FiActivity className="text-orange-400 animate-pulse" size={12} />
                                            </h4>
                                            <span className="text-[9px] text-gray-400 whitespace-nowrap">
                                                {visitor.lastAccessedDate?.split(' ')[1] || 'Now'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{currentEng?.engagementName || 'Direct Engagement'}</p>

                                        <div className="flex items-center justify-between mt-2.5">
                                            {activeAgentId ? (
                                                <span className="bg-[#1a8949] text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-tight">
                                                    Jeraldin Utala
                                                </span>
                                            ) : (
                                                <button className="text-white bg-[#ef4444]/80 px-2 py-0.5 rounded text-[9px] font-bold hover:bg-red-600 transition-all shadow-sm">
                                                    Request Assist
                                                </button>
                                            )}
                                            <div className="w-5 h-5 bg-[#25d366] rounded-full flex items-center justify-center shadow-sm">
                                                <FiMessageSquare size={10} className="text-white fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 shadow-inner">
                                <FiSearch size={32} />
                            </div>
                            <p className="text-xs font-black uppercase text-gray-400 tracking-widest">No Matches</p>
                        </div>
                    )}
                </div>
            </div>
            {/* ASSISTANCE TOAST (From Screenshot) */}
            <div className="absolute bottom-6 right-6 w-[320px] bg-[#d1ecf1] border border-[#bee5eb] rounded-xl shadow-2xl p-4 flex items-center gap-4 animate-bounce z-50">
                <div className="flex gap-2 text-[#0c5460]">
                    <FiMessageSquare size={24} />
                    <FiAlertTriangle size={24} className="text-gray-700" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-[#0c5460]">
                        Visitor <span className="text-orange-600">{selectedVisitor?.contacts?.firstName || 'User'}</span> from <span className="text-orange-600">WhatsApp</span> needs assistance.
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#17a2b8] animate-[shrink_10s_linear]" style={{ width: '65%' }}></div>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <FiLogOut size={16} />
                </button>
            </div>
        </div>
    );
};

export default WebVisitorsCard;
