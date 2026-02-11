import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiUserX, FiActivity, FiRefreshCw, FiClock, FiGlobe } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { MerchantUser } from '../types/merchant';

interface AnalyticsCardProps {
    merchantId: string;
    cluster?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ merchantId, cluster }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        lastActivity: 'N/A',
        lastUser: null as MerchantUser | null,
        totalVisitors: 0,
        lastVisitorArrival: 'N/A'
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Fetch users to compute stats
            const usersPromise = merchantService.getAllUsers(merchantId, cluster);
            // Fetch visitors count and last visitor arrival (historical)
            const rawVisitorsPromise = merchantService.getRawVisitorsList(merchantId, 0, 5, cluster);
            // Fetch live visitors
            const liveVisitorsPromise = merchantService.getWebVisitors(merchantId, cluster);

            const [users, rawResponse, liveResponse] = await Promise.all([
                usersPromise,
                rawVisitorsPromise,
                liveVisitorsPromise
            ]);

            const userList: MerchantUser[] = Array.isArray(users) ? users : [];
            const totalVisitors = rawResponse?.total || rawResponse?.totalElements || 0;

            // Extract last visitor arrival from both sources
            let lastVisitorInfo = {
                arrival: 'N/A',
                name: '',
                id: ''
            };

            const allPotentialVisitors: any[] = [];
            // Handle getRawVisitorsList response structure
            const rawVisitorsList = rawResponse?.rawVisitors || (Array.isArray(rawResponse) ? rawResponse : []);
            if (rawVisitorsList.length > 0) {
                allPotentialVisitors.push(...rawVisitorsList);
            }
            // Handle getWebVisitors response
            const liveVisitorsList = Array.isArray(liveResponse) ? liveResponse : [];
            if (liveVisitorsList.length > 0) {
                allPotentialVisitors.push(...liveVisitorsList);
            }

            if (allPotentialVisitors.length > 0) {
                // Find the absolute latest based on lastAccessedDate or similar
                const sorted = [...allPotentialVisitors].sort((a, b) => {
                    const getTime = (v: any) => {
                        const d = v.lastAccessedDate || v.lastAccessedDate_dt || v.visitedAt || v.createTime || 0;
                        if (!d) return 0;
                        const t = new Date(d).getTime();
                        return isNaN(t) ? 0 : t;
                    };
                    return getTime(b) - getTime(a);
                });

                const latest = sorted[0];
                const rawDate = latest.lastAccessedDate ||
                    latest.lastAccessedDate_dt ||
                    latest.visitedAt ||
                    latest.createTime;

                if (rawDate) {
                    const parsedDate = new Date(rawDate);
                    if (!isNaN(parsedDate.getTime())) {
                        lastVisitorInfo.arrival = parsedDate.toLocaleString();
                    } else {
                        // Fallback for tricky date strings
                        lastVisitorInfo.arrival = rawDate.toString();
                    }
                }

                // Identify the visitor
                lastVisitorInfo.name = latest.contacts?.firstName || latest.visitorId || 'Visitor';
                lastVisitorInfo.id = latest.visitorId || latest.sessionID || latest.id || '';
            }

            const total = userList.length;
            const active = userList.filter((u) => u.status.toLowerCase() === 'active').length;
            const inactive = total - active;

            // Find latest modification (User)
            let latestUserActivity = 'N/A';
            let lastUserObj: MerchantUser | null = null;
            if (userList.length > 0) {
                const sortedUsers = [...userList].sort((a, b) => {
                    const timeA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
                    const timeB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
                    return timeB - timeA;
                });

                const latestUser = sortedUsers[0];
                if (latestUser && latestUser.modifiedTime) {
                    latestUserActivity = new Date(latestUser.modifiedTime).toLocaleDateString();
                    lastUserObj = latestUser;
                }
            }

            setStats({
                totalUsers: total,
                activeUsers: active,
                inactiveUsers: inactive,
                lastActivity: latestUserActivity,
                lastUser: lastUserObj,
                totalVisitors: totalVisitors,
                activeVisitors: Array.isArray(liveResponse) ? liveResponse.length : 0,
                lastVisitorArrival: lastVisitorInfo.arrival,
                // Add new fields to state for detailed display
                lastVisitorName: lastVisitorInfo.name,
                lastVisitorId: lastVisitorInfo.id
            } as any);

        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (merchantId) {
            fetchStats();
        }
    }, [merchantId, cluster]);

    const MetricRow = ({ label, value, icon: Icon, color, bg, subValue }: any) => (
        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                    {subValue && <p className="text-[10px] text-gray-400">{subValue}</p>}
                </div>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-gray-900 leading-tight">
                    {loading ? <div className="h-6 w-16 bg-gray-100 animate-pulse rounded inline-block"></div> : value}
                </p>
            </div>
        </div>
    );

    const ActivityRow = ({ label, title, subtitle, time, icon: Icon, color, bg }: any) => (
        <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
            <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center mt-1`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                    <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap ml-2">{time}</span>
                </div>
                {loading ? (
                    <div className="space-y-1">
                        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded"></div>
                        <div className="h-3 w-32 bg-gray-50 animate-pulse rounded"></div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
                        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <div className="p-2 bg-genx-50 rounded-lg mr-3 text-genx-600">
                        <FiActivity size={20} />
                    </div>
                    Merchant Analytics
                </h3>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-genx-600 hover:bg-genx-50 transition-all duration-200 border border-transparent hover:border-genx-100"
                >
                    <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Column 1: User Metrics */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                        <FiUsers className="text-blue-500" /> User Metrics
                    </h4>
                    <div className="space-y-1">
                        <MetricRow
                            label="Total Users"
                            value={stats.totalUsers}
                            icon={FiUsers}
                            color="text-blue-600"
                            bg="bg-blue-50"
                        />
                        <div className="h-px bg-gray-50 my-1 mx-2"></div>
                        <MetricRow
                            label="Active Users"
                            value={stats.activeUsers}
                            icon={FiUserCheck}
                            color="text-emerald-600"
                            bg="bg-emerald-50"
                        />
                        <div className="h-px bg-gray-50 my-1 mx-2"></div>
                        <MetricRow
                            label="Inactive Users"
                            value={stats.inactiveUsers}
                            icon={FiUserX}
                            color="text-red-500"
                            bg="bg-red-50"
                        />
                    </div>
                </div>

                {/* Column 2: Visitor Insights */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                        <FiGlobe className="text-indigo-500" /> Visitor Insights
                    </h4>
                    <div className="space-y-1">
                        <MetricRow
                            label="Total Visitors"
                            value={stats.totalVisitors}
                            icon={FiUsers}
                            color="text-indigo-600"
                            bg="bg-indigo-50"
                        />
                        <div className="h-px bg-gray-50 my-1 mx-2"></div>
                        <MetricRow
                            label="Active Visitors"
                            value={(stats as any).activeVisitors || 0}
                            icon={FiGlobe}
                            color="text-[#36b37e]"
                            bg="bg-[#e3fcef]"
                        />
                        <div className="h-px bg-gray-50 my-1 mx-2"></div>
                        <div className="p-3 bg-gray-50 rounded-lg mt-2">
                            <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider">
                                Real-time tracking enabled
                            </p>
                        </div>
                    </div>
                </div>

                {/* Column 3: Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                        <FiClock className="text-orange-500" /> Recent Activity
                    </h4>
                    <div className="space-y-1">
                        <ActivityRow
                            label="User Action"
                            title={stats.lastUser ? (stats.lastUser.firstName || stats.lastUser.userName) : 'No Data'}
                            subtitle={stats.lastUser ? stats.lastUser.email : '-'}
                            time={stats.lastActivity !== 'N/A' ? stats.lastActivity : ''}
                            icon={FiActivity}
                            color="text-purple-600"
                            bg="bg-purple-50"
                        />
                        <div className="h-px bg-gray-50 my-1 mx-2"></div>
                        <ActivityRow
                            label="New Visitor"
                            title={(stats as any).lastVisitorName || 'No Data'}
                            subtitle={(stats as any).lastVisitorId ? `${(stats as any).lastVisitorId.substring(0, 15)}...` : '-'}
                            time={stats.lastVisitorArrival !== 'N/A' && stats.lastVisitorArrival ? stats.lastVisitorArrival.split(',')[0] : ''} // formatting date
                            icon={FiClock}
                            color="text-orange-600"
                            bg="bg-orange-50"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCard;
