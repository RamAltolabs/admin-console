import React, { useState, useEffect } from 'react';
import { FiActivity, FiClock, FiMapPin, FiRefreshCw, FiGlobe } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { formatDate, formatTime, getValidDate } from '../utils/dateUtils';


interface RecentVisitorsCardProps {
    merchantId: string;
    cluster?: string;
    isEmbedded?: boolean;
}


const RecentVisitorsCard: React.FC<RecentVisitorsCardProps> = ({ merchantId, cluster, isEmbedded = false }) => {
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecent = async () => {
        setLoading(true);
        try {
            const response = await merchantService.getRawVisitors(merchantId, 0, 10, cluster);
            setVisitors(Array.isArray(response?.content) ? response.content : []);
        } catch (err) {
            console.error('Failed to fetch recent visitors:', err);
            setVisitors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecent();
    }, [merchantId, cluster]);

    return (
        <div className={isEmbedded ? "h-full flex flex-col" : "bg-white overflow-hidden h-full flex flex-col border border-gray-100 shadow-sm rounded-xl"}>
            {!isEmbedded && (
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FiClock size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-gray-800 titlecase tracking-wide">Recent Visitors</h2>
                    </div>
                    <button
                        onClick={fetchRecent}
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
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 titlecase tracking-wider">Merchant ID</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 titlecase tracking-wider">Engagement</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 titlecase tracking-wider">Time</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <span className="text-[10px] font-bold uppercase text-gray-400">Loading...</span>
                                </td>
                            </tr>
                        ) : visitors.length > 0 ? (
                            visitors.map((v, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-100">
                                                {(() => {
                                                    const contacts = v.contacts || v.contact;
                                                    if (contacts) {
                                                        const c = Array.isArray(contacts) ? contacts[0] : contacts;
                                                        const fn = c?.firstName || c?.first_name || c?.FirstName || '';
                                                        if (fn) return fn.charAt(0).toUpperCase();
                                                    }
                                                    return v.visitorId?.substring(0, 1).toUpperCase() || 'V';
                                                })()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-600 truncate max-w-[150px] transition-colors">
                                                    {(() => {
                                                        const contacts = v.contacts || v.contact;
                                                        let fn = '';
                                                        let ln = '';
                                                        if (contacts) {
                                                            const c = Array.isArray(contacts) ? contacts[0] : contacts;
                                                            fn = c?.firstName || c?.first_name || c?.FirstName || '';
                                                            ln = c?.lastName || c?.last_name || c?.LastName || '';
                                                            if (!fn && !ln) {
                                                                const cn = c?.name || c?.fullName || c?.full_name || '';
                                                                if (cn) return cn;
                                                            }
                                                        }
                                                        fn = fn || v.firstName || v.first_name || v.FirstName || '';
                                                        ln = ln || v.lastName || v.last_name || v.LastName || '';
                                                        const fullName = `${fn} ${ln}`.trim();
                                                        if (fullName) return fullName;
                                                        if (v.visitorName || v.name) return v.visitorName || v.name;
                                                        const idStr = v.id || v.visitorId || '';
                                                        const parts = idStr.split('-');
                                                        const prefix = parts.length > 1 ? parts[0] : idStr.substring(0, 8);
                                                        return `visitor.${prefix || 'Unknown'}`;
                                                    })()}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">ID: {v.id?.split('-')[0] || v.visitorId?.substring(0, 8) || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-[9px] font-bold">
                                                {v.cluster?.substring(0, 1).toUpperCase() || 'C'}
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-600 font-bold">
                                                {v.merchantID || v.merchantId || merchantId}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="text-xs font-semibold text-gray-600">
                                            {(() => {
                                                const engagements = v.engagements || [];
                                                const e = Array.isArray(engagements) ? engagements[0] : engagements;
                                                return e?.engagementName || v.engagementName || 'N/A';
                                            })()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-gray-700">
                                                {(() => {
                                                    const dateCandidates = [
                                                        v.visitedAt, 
                                                        v.lastAccessedDate_dt, 
                                                        v.lastAccessedDate, 
                                                        v.createdDate,
                                                        v.createTime, 
                                                        v.createdAt,
                                                        v.lastModifiedDate, 
                                                        v.accessDate,
                                                        v.visitTime, 
                                                        v.timestamp, 
                                                        v.date, 
                                                        v.updatedAt,
                                                        v.engagements?.[0]?.accessDate,
                                                        v.engagements?.[0]?.allConversations?.[0]?.startTime
                                                    ];
                                                    let validDate: Date | null = null;
                                                    for (const c of dateCandidates) {
                                                        validDate = getValidDate(c);
                                                        if (validDate) break;
                                                    }
                                                    return formatDate(validDate);
                                                })()}
                                            </span>
                                            <span className="text-[9px] font-medium text-gray-400 uppercase">
                                                {(() => {
                                                    const dateCandidates = [
                                                        v.visitedAt, 
                                                        v.lastAccessedDate_dt, 
                                                        v.lastAccessedDate, 
                                                        v.createdDate,
                                                        v.createTime, 
                                                        v.createdAt,
                                                        v.lastModifiedDate, 
                                                        v.accessDate,
                                                        v.visitTime, 
                                                        v.timestamp, 
                                                        v.date, 
                                                        v.updatedAt,
                                                        v.engagements?.[0]?.accessDate,
                                                        v.engagements?.[0]?.allConversations?.[0]?.startTime
                                                    ];
                                                    let validDate: Date | null = null;
                                                    for (const c of dateCandidates) {
                                                        validDate = getValidDate(c);
                                                        if (validDate) break;
                                                    }
                                                    return formatTime(validDate);
                                                })()}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))

                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-xs font-medium text-gray-400 uppercase tracking-widest">
                                    No recent visits found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentVisitorsCard;
