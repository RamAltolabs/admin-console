import React, { useState, useEffect } from 'react';
import { FiUser, FiSmile, FiCornerRightUp, FiGlobe } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface OnlineVisitorsCardProps {
    merchantId: string;
    cluster?: string;
    isEmbedded?: boolean;
}

const OnlineVisitorsCard: React.FC<OnlineVisitorsCardProps> = ({ merchantId, cluster, isEmbedded = false }) => {
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                                <FiGlobe size={5} />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </div>
                        </div>
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Online Visitors</h2>
                    </div>
                    <button
                        onClick={fetchVisitorList}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                    >
                        <FiCornerRightUp size={12} className={loading ? "animate-spin" : ""} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visitor Name</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Agent</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Channel</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Activity</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {visitors.length === 0 ? (
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
                            visitors.map((visitor, idx) => (
                                <tr key={visitor.id || idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100">
                                                {visitor.contacts?.firstName?.charAt(0).toUpperCase() || visitor.name?.charAt(0).toUpperCase() || 'V'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate max-w-[150px] transition-colors">
                                                    {visitor.contacts?.firstName || visitor.name || 'Anonymous'}
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
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OnlineVisitorsCard;
