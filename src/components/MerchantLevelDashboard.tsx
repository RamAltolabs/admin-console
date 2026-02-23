import React, { useState, useEffect } from 'react';
import { FiActivity, FiUsers, FiTrendingUp, FiRefreshCw, FiInfo, FiSmile, FiCheckCircle, FiAlertCircle, FiRotateCcw, FiUser, FiGlobe, FiShoppingCart, FiDollarSign, FiTarget, FiBarChart2, FiPieChart } from 'react-icons/fi';
import merchantService from '../services/merchantService';
import { calculatePercentage, formatNumber } from '../utils/analytics';

interface MerchantLevelDashboardProps {
    merchantId: string;
    merchantName: string;
    cluster?: string;
}

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    onlineUsers: number;
    totalVisitors: number;
    liveVisitors: number;
    totalEngagements: number;
    totalProducts: number;
    availableProducts: number;
    unavailableProducts: number;
    inactiveProducts: number;
    totalOrders: number;
    activeSessions: number;
    totalRevenue: number;
    averageOrderValue: number;
    activeCampaigns: number;
    botExecutions: number;
    aiModels: number;
    knowledgeBases: number;
}

const MerchantLevelDashboard: React.FC<MerchantLevelDashboardProps> = ({ merchantId, merchantName, cluster }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        onlineUsers: 0,
        totalVisitors: 0,
        liveVisitors: 0,
        totalEngagements: 0,
        totalProducts: 0,
        availableProducts: 0,
        unavailableProducts: 0,
        inactiveProducts: 0,
        totalOrders: 0,
        activeSessions: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        activeCampaigns: 0,
        botExecutions: 0,
        aiModels: 0,
        knowledgeBases: 0
    });

    // Fetch merchant dashboard data
    const fetchDashboardData = async () => {
        setRefreshing(true);
        try {
            const [usersResponse, visitorsResponse, engagements, products, orders, liveVisitorsData, onlineAgentsData, paymentData, campaigns, botExecution, kbResponse, aiAgents] = await Promise.all([
                merchantService.getUsers(merchantId, 0, 1000, cluster).catch(() => ({ content: [], totalElements: 0 })),
                merchantService.getRawVisitors(merchantId, 0, 1000, cluster).catch(() => ({ content: [], totalElements: 0 })),
                merchantService.getEngagementList(merchantId, cluster).catch(() => ({ engagements: [] })),
                merchantService.getProducts(merchantId, cluster, true, true).catch(() => []),
                merchantService.getOrders(merchantId, cluster).catch(() => []),
                merchantService.getWebVisitors(merchantId, cluster).catch(() => []),
                merchantService.getOnlineAgents(merchantId, cluster).catch(() => []),
                merchantService.getPaymentDetails(merchantId, undefined, undefined, cluster).catch(() => ({})),
                merchantService.getCampaigns(merchantId, cluster).catch(() => []),
                merchantService.getChatBotExecution(merchantId, 0, 100, cluster).catch(() => ({})),
                merchantService.getKnowledgeBases(merchantId, 0, 100, cluster).catch(() => ({ content: [] })),
                merchantService.getAIAgents(merchantId, cluster).catch(() => [])
            ]);

            const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.content || []);
            const visitors = Array.isArray(visitorsResponse) ? visitorsResponse : (visitorsResponse?.content || []);

            const activeUserCount = users.filter(u => u.status?.toLowerCase() === 'active').length;
            let onlineUserCount = users.filter(u => u.available === true).length;
            if (Array.isArray(onlineAgentsData)) {
                onlineUserCount = onlineAgentsData.length;
            } else if (onlineAgentsData?.data && Array.isArray(onlineAgentsData.data)) {
                onlineUserCount = onlineAgentsData.data.length;
            } else if (onlineAgentsData?.content && Array.isArray(onlineAgentsData.content)) {
                onlineUserCount = onlineAgentsData.content.length;
            } else if (typeof onlineAgentsData?.totalElements === 'number') {
                onlineUserCount = onlineAgentsData.totalElements;
            } else if (typeof (onlineAgentsData as any)?.total === 'number') {
                onlineUserCount = (onlineAgentsData as any).total;
            } else if (typeof (onlineAgentsData as any)?.count === 'number') {
                onlineUserCount = (onlineAgentsData as any).count;
            }
            
            // Get total visitors - try multiple possible response formats
            let visitorsCount = 0;
            if (visitorsResponse?.totalElements !== undefined) {
                visitorsCount = visitorsResponse.totalElements;
            } else if ((visitorsResponse as any)?.total !== undefined) {
                visitorsCount = (visitorsResponse as any).total;
            } else if (Array.isArray(visitors)) {
                visitorsCount = visitors.length;
            }
            
            // Extract live visitors count
            let liveVisitorsCount = 0;
            if (Array.isArray(liveVisitorsData)) {
                liveVisitorsCount = liveVisitorsData.length;
            } else if (liveVisitorsData?.data && Array.isArray(liveVisitorsData.data)) {
                liveVisitorsCount = liveVisitorsData.data.length;
            } else if (liveVisitorsData?.onlineVisitors && Array.isArray(liveVisitorsData.onlineVisitors)) {
                liveVisitorsCount = liveVisitorsData.onlineVisitors.length;
            } else if (typeof liveVisitorsData === 'object' && liveVisitorsData !== null) {
                const count = Object.keys(liveVisitorsData).filter(key => 
                    typeof liveVisitorsData[key] === 'object' && liveVisitorsData[key] !== null
                ).length;
                liveVisitorsCount = count > 0 ? count : 0;
            }
            
            let engagementCount = 0;
            if (Array.isArray(engagements)) {
                engagementCount = engagements.length;
            } else if (engagements?.engagements) {
                engagementCount = Array.isArray(engagements.engagements) ? engagements.engagements.length : 0;
            } else if (engagements?.data) {
                engagementCount = Array.isArray(engagements.data) ? engagements.data.length : 0;
            } else if (engagements?.content) {
                engagementCount = Array.isArray(engagements.content) ? engagements.content.length : 0;
            } else if (engagements?.totalElements !== undefined) {
                engagementCount = engagements.totalElements;
            }

            // Extract payment data - revenue and average order value
            let totalRevenue = 0;
            let averageOrderValue = 0;
            if (paymentData && typeof paymentData === 'object') {
                if (paymentData.totalAmount) {
                    totalRevenue = parseFloat(String(paymentData.totalAmount)) || 0;
                }
                if (paymentData.averageAmount) {
                    averageOrderValue = parseFloat(String(paymentData.averageAmount)) || 0;
                } else if (Array.isArray(paymentData.payments) && paymentData.payments.length > 0) {
                    const total = paymentData.payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
                    averageOrderValue = total / paymentData.payments.length;
                }
            }

            const productList = Array.isArray(products) ? products : [];
            const availableProductsCount = productList.filter((p: any) =>
                p?.available === true || String(p?.available).toLowerCase() === 'true' || p?.available === 1 || p?.available === '1'
            ).length;
            const unavailableProductsCount = productList.filter((p: any) =>
                p?.available === false || String(p?.available).toLowerCase() === 'false' || p?.available === 0 || p?.available === '0'
            ).length;
            const inactiveProductsCount = productList.filter((p: any) => {
                const status = String(p?.status || '').toLowerCase();
                return p?.active === false || status === 'inactive';
            }).length;

            // Extract campaign data
            let activeCampaigns = 0;
            if (Array.isArray(campaigns)) {
                activeCampaigns = campaigns.filter((c: any) => c.status?.toLowerCase() === 'active').length;
            } else if (campaigns?.content) {
                activeCampaigns = campaigns.content.filter((c: any) => c.status?.toLowerCase() === 'active').length;
            }

            // Extract bot execution count
            let botExecutionCount = 0;
            if (botExecution?.totalElements !== undefined) {
                botExecutionCount = botExecution.totalElements;
            } else if (Array.isArray(botExecution?.content)) {
                botExecutionCount = botExecution.content.length;
            }

            // Extract knowledge bases count
            let kbCount = 0;
            if (kbResponse && typeof kbResponse === 'object') {
                if ((kbResponse as any)?.totalElements !== undefined) {
                    kbCount = (kbResponse as any).totalElements;
                } else if ((kbResponse as any)?.content && Array.isArray((kbResponse as any).content)) {
                    kbCount = (kbResponse as any).content.length;
                } else if (Array.isArray(kbResponse)) {
                    kbCount = kbResponse.length;
                }
            }

            console.log('[MerchantLevelDashboard] Dashboard Data Extracted:', {
                users: {
                    total: users.length,
                    active: activeUserCount,
                    online: onlineUserCount
                },
                visitors: {
                    total: visitorsCount,
                    live: liveVisitorsCount
                },
                engagements: engagementCount,
                products: {
                    total: productList.length,
                    available: availableProductsCount,
                    unavailable: unavailableProductsCount,
                    inactive: inactiveProductsCount
                },
                orders: Array.isArray(orders) ? orders.length : 0,
                revenue: totalRevenue,
                averageOrderValue: averageOrderValue,
                campaigns: activeCampaigns,
                botExecutions: botExecutionCount,
                aiModels: Array.isArray(aiAgents) ? aiAgents.length : 0,
                knowledgeBases: kbCount
            });

            setStats({
                totalUsers: users.length,
                activeUsers: activeUserCount,
                onlineUsers: onlineUserCount,
                totalVisitors: visitorsCount,
                liveVisitors: liveVisitorsCount,
                totalEngagements: engagementCount,
                totalProducts: productList.length,
                availableProducts: availableProductsCount,
                unavailableProducts: unavailableProductsCount,
                inactiveProducts: inactiveProductsCount,
                totalOrders: Array.isArray(orders) ? orders.length : 0,
                activeSessions: onlineUserCount,
                totalRevenue: totalRevenue,
                averageOrderValue: averageOrderValue,
                activeCampaigns: activeCampaigns,
                botExecutions: botExecutionCount,
                aiModels: Array.isArray(aiAgents) ? aiAgents.length : 0,
                knowledgeBases: kbCount
            });

            setLoading(false);
        } catch (err) {
            console.error('Error fetching merchant dashboard:', err);
            if (err instanceof Error) {
                console.error('[MerchantLevelDashboard] Error Details:', {
                    message: err.message,
                    stack: err.stack
                });
            }
            setLoading(false);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [merchantId, cluster]);

    // Auto-refresh logic
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (autoRefresh) {
            intervalId = setInterval(() => {
                setLastUpdated(new Date());
                fetchDashboardData();
            }, 60000); // 60 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoRefresh, merchantId, cluster]);

    const handleManualRefresh = async () => {
        setLastUpdated(new Date());
        await fetchDashboardData();
    };

    const StatCard: React.FC<{
        title: string;
        value: number;
        icon: React.ReactNode;
        color: string;
        percentage?: number;
        trend?: number;
        refreshing?: boolean;
        hint?: string;
        isCurrency?: boolean;
    }> = ({ title, value, icon, color, percentage, trend, refreshing: isRefreshing, hint, isCurrency = false }) => {
        const [showHint, setShowHint] = useState(false);

        const formatValue = (val: number) => {
            if (isCurrency) {
                return `$${formatNumber(val)}`;
            }
            return formatNumber(val);
        };

        return (
            <div className="card-premium p-3.5 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md hover:border-primary-main/30 group relative">
                {hint && (
                    <div className="absolute top-3 right-3 z-10">
                        <div className="relative">
                            <button
                                onMouseEnter={() => setShowHint(true)}
                                onMouseLeave={() => setShowHint(false)}
                                className="text-neutral-text-muted hover:text-primary-main transition-colors p-1"
                            >
                                <FiInfo size={12} />
                            </button>
                            {showHint && (
                                <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-neutral-900 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none border border-white/10">
                                    {hint}
                                    <div className="absolute -top-1 right-2 w-2 h-2 bg-neutral-900 transform rotate-45 border-t border-l border-white/10"></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-3">
                    <div
                        className="p-2 rounded-xl transition-colors duration-300 relative"
                        style={{
                            backgroundColor: `${color}10`,
                            color: color
                        }}
                    >
                        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
                        {isRefreshing && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-neutral-border/50">
                                <FiRefreshCw size={8} className="animate-spin text-primary-main" />
                            </div>
                        )}
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} mr-6`}>
                            {trend >= 0 ? '+' : ''}{trend}%
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-[9px] font-bold text-neutral-text-muted titlecase tracking-[0.1em] mb-1 group-hover:text-neutral-text-secondary transition-colors">{title}</p>
                    <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-neutral-text-main tracking-tight leading-none">
                            {isRefreshing ? (
                                <span className="inline-block w-12 h-6 bg-neutral-bg animate-pulse rounded"></span>
                            ) : (
                                formatValue(value)
                            )}
                        </p>
                        {percentage !== undefined && !isRefreshing && (
                            <span className="text-[10px] font-bold text-neutral-text-secondary pb-0.5">
                                {percentage}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-main border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-xs font-bold text-neutral-text-muted titlecase tracking-widest">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 md:p-5 lg:p-6 mx-auto space-y-4 pb-20">
            {/* Merchant Dashboard Header Tile */}
            <div className="bg-white rounded-2xl border border-neutral-border shadow-sm overflow-hidden mb-3">
                <div className="bg-gradient-to-r from-primary-main/5 via-transparent to-transparent px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl border border-neutral-border shadow-sm flex items-center justify-center text-primary-main shrink-0">
                            <FiActivity size={20} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-text-main tracking-tight leading-tight">{merchantName}</h1>
                                    <p className="text-[10px] font-bold text-neutral-text-muted titlecase tracking-widest mt-0.5">Merchant Dashboard</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded-md border shadow-sm transition-all ${autoRefresh
                                        ? 'bg-green-50 text-green-600 border-green-100/50'
                                        : 'bg-orange-50 text-orange-600 border-orange-100/50'
                                        }`}>
                                        {autoRefresh ? (
                                            <>
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                <span className="text-[10px] font-bold titlecase tracking-wider">Live Fetching</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="relative flex h-2 w-2">
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                                </span>
                                                <span className="text-[10px] font-bold titlecase tracking-wider">Live Fetch Paused</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-neutral-bg text-neutral-text-muted rounded-md border border-neutral-border/50">
                                        <span className="text-[10px] font-bold titlecase tracking-wider">
                                            Updated {Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000)}m ago
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 ml-1">
                                        <button
                                            onClick={() => setAutoRefresh(!autoRefresh)}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${autoRefresh
                                                ? 'bg-blue-900 text-white border-blue-700 shadow-sm'
                                                : 'bg-white border-neutral-border text-neutral-text-muted hover:border-primary-main/30'
                                                }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-white animate-pulse' : 'bg-neutral-border'}`}></div>
                                            <span className="text-[10px] font-bold titlecase tracking-wider whitespace-nowrap">Sync: {autoRefresh ? 'ON' : 'OFF'}</span>
                                        </button>
                                        <button
                                            onClick={handleManualRefresh}
                                            className="p-1.5 bg-white text-primary-main border border-primary-main/20 rounded-lg hover:bg-primary-main hover:text-white transition-all shadow-sm group/refresh active:scale-90"
                                            title="Force Refresh Data"
                                            disabled={refreshing}
                                        >
                                            <FiRotateCcw size={14} className={`transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-active/refresh:rotate-180'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Context Row */}
                            <div className="flex flex-wrap items-center gap-x-3 text-[11px] font-medium text-neutral-text-secondary bg-neutral-bg/30 px-3 py-1.5 rounded-lg border border-neutral-border/30 w-fit">
                                <div className="flex items-center gap-2">
                                    <FiGlobe size={13} className="text-primary-main/70" />
                                    <span className="font-semibold">Cluster:</span>
                                    <span className="text-[#0052cc] font-black tracking-wide bg-white px-2 py-0.5 rounded border border-[#0052cc]/10">
                                        {cluster || 'DEFAULT'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid: Merchant Level Metrics - Row 1 */}
            <div id="merchant-stats" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 scroll-mt-24">
                <StatCard
                    title="Total Agents"
                    value={stats.totalUsers}
                    icon={<FiUsers />}
                    color="#0052cc"
                    trend={12}
                    refreshing={refreshing}
                    hint="Total number of registered users/agents for this merchant."
                />
                <StatCard
                    title="Active Agents"
                    value={stats.activeUsers}
                    icon={<FiCheckCircle />}
                    color="#36b37e"
                    percentage={stats.totalUsers > 0 ? calculatePercentage(stats.activeUsers, stats.totalUsers) : 0}
                    trend={5}
                    refreshing={refreshing}
                    hint="Users currently marked as 'Active'."
                />
                <StatCard
                    title="Agents Online Now"
                    value={stats.onlineUsers}
                    icon={<FiActivity />}
                    color="#ffab00"
                    trend={8}
                    refreshing={refreshing}
                    hint="Users currently logged in and active."
                />
                <StatCard
                    title="Total Visitors"
                    value={stats.totalVisitors}
                    icon={<FiSmile />}
                    color="#00b8d9"
                    trend={22}
                    refreshing={refreshing}
                    hint="Total number of unique visitors to your merchant account."
                />
                <StatCard
                    title="Live Visitors"
                    value={stats.liveVisitors}
                    icon={<FiActivity />}
                    color="#00c49f"
                    refreshing={refreshing}
                    hint="Number of visitors currently online and active on your website."
                />
                <StatCard
                    title="Engagements"
                    value={stats.totalEngagements}
                    icon={<FiTrendingUp />}
                    color="#6554c0"
                    trend={15}
                    refreshing={refreshing}
                    hint="Total number of customer engagements recorded."
                />
                <StatCard
                    title="Products"
                    value={stats.totalProducts}
                    icon={<FiAlertCircle />}
                    color="#ff5630"
                    refreshing={refreshing}
                    hint="Total number of products managed by this merchant."
                />
                <StatCard
                    title="Orders"
                    value={stats.totalOrders}
                    icon={<FiShoppingCart />}
                    color="#0052cc"
                    trend={18}
                    refreshing={refreshing}
                    hint="Total number of orders processed."
                />
            </div>

            {/* Stats Grid: Advanced Metrics - Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-3">
                <StatCard
                    title="Total Revenue"
                    value={stats.totalRevenue}
                    icon={<FiDollarSign />}
                    color="#36b37e"
                    trend={24}
                    refreshing={refreshing}
                    hint="Total revenue generated from all transactions."
                    isCurrency
                />
                <StatCard
                    title="Avg Order Value"
                    value={stats.averageOrderValue}
                    icon={<FiBarChart2 />}
                    color="#0052cc"
                    refreshing={refreshing}
                    hint="Average value of each order processed."
                    isCurrency
                />
                <StatCard
                    title="Active Campaigns"
                    value={stats.activeCampaigns}
                    icon={<FiTarget />}
                    color="#ff5630"
                    percentage={100}
                    refreshing={refreshing}
                    hint="Number of currently active marketing campaigns."
                />
                <StatCard
                    title="Bot Executions"
                    value={stats.botExecutions}
                    icon={<FiActivity />}
                    color="#6554c0"
                    trend={35}
                    refreshing={refreshing}
                    hint="Total bot/chatbot execution count."
                />
                <StatCard
                    title="Knowledge Bases"
                    value={stats.knowledgeBases}
                    icon={<FiPieChart />}
                    color="#00b8d9"
                    refreshing={refreshing}
                    hint="Total knowledge bases configured for this merchant."
                />
                <StatCard
                    title="AI Models"
                    value={stats.aiModels}
                    icon={<FiTrendingUp />}
                    color="#ffab00"
                    refreshing={refreshing}
                    hint="Number of AI agents/models deployed."
                />
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="card-premium p-4">
                    <h3 className="text-[11px] font-bold text-neutral-text-main titlecase tracking-[0.15em] mb-4 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-main mr-2"></div>
                        Agent Metrics Summary
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Agent Engagement</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.activeUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Online Agents</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.onlineUsers}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Total Agents</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.totalUsers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Online Percentage</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>

                <div className="card-premium p-4">
                    <h3 className="text-[11px] font-bold text-neutral-text-main titlecase tracking-[0.15em] mb-4 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-main mr-2"></div>
                        Visitor & Engagement
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Total Visitors</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.totalVisitors}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Live Visitors</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.liveVisitors}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Total Engagements</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.totalEngagements}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Visitor Return Rate</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.liveVisitors > 0 ? Math.round((stats.liveVisitors / Math.max(stats.totalVisitors, 1)) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>

                <div className="card-premium p-4">
                    <h3 className="text-[11px] font-bold text-neutral-text-main titlecase tracking-[0.15em] mb-4 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-main mr-2"></div>
                        Business Metrics
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Total Orders</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.totalOrders}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Total Revenue</span>
                            <span className="text-sm font-bold text-primary-main">${formatNumber(stats.totalRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Avg Order Value</span>
                            <span className="text-sm font-bold text-neutral-text-main">${formatNumber(stats.averageOrderValue)}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Products (All)</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.totalProducts}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Available Products</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.availableProducts}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Unavailable Products</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.unavailableProducts}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Inactive Products</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.inactiveProducts}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="card-premium p-4">
                    <h3 className="text-[11px] font-bold text-neutral-text-main titlecase tracking-[0.15em] mb-4 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-main mr-2"></div>
                        Performance Overview
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30 group relative">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Visitor Conversion</span>
                                <button className="text-neutral-text-muted hover:text-primary-main transition-colors p-0.5 group/hint">
                                    <FiInfo size={11} />
                                    <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-neutral-900 text-white text-[9px] rounded-lg shadow-xl z-50 pointer-events-none opacity-0 group-hover/hint:opacity-100 transition-opacity border border-white/10">
                                        Percentage of visitors who took an engagement action. (Engagements ÷ Visitors)
                                    </div>
                                </button>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-neutral-text-main block">
                                    {stats.totalVisitors > 0 
                                        ? `${Math.round((stats.totalEngagements / stats.totalVisitors) * 100)}%`
                                        : '—'}
                                </span>
                                <span className="text-[8px] text-neutral-text-muted">{stats.totalEngagements}/{stats.totalVisitors}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30 group relative">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">User Activity</span>
                                <button className="text-neutral-text-muted hover:text-primary-main transition-colors p-0.5 group/hint">
                                    <FiInfo size={11} />
                                    <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-neutral-900 text-white text-[9px] rounded-lg shadow-xl z-50 pointer-events-none opacity-0 group-hover/hint:opacity-100 transition-opacity border border-white/10">
                                        Percentage of users currently online or active. (Online Users ÷ Total Users)
                                    </div>
                                </button>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-neutral-text-main block">
                                    {stats.totalUsers > 0
                                        ? `${Math.round((stats.onlineUsers / stats.totalUsers) * 100)}%`
                                        : '—'}
                                </span>
                                <span className="text-[8px] text-neutral-text-muted">{stats.onlineUsers}/{stats.totalUsers}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30 group relative">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Engagement Ratio</span>
                                <button className="text-neutral-text-muted hover:text-primary-main transition-colors p-0.5 group/hint">
                                    <FiInfo size={11} />
                                    <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-neutral-900 text-white text-[9px] rounded-lg shadow-xl z-50 pointer-events-none opacity-0 group-hover/hint:opacity-100 transition-opacity border border-white/10">
                                        Average number of engagements per visitor. (Total Engagements ÷ Total Visitors)
                                    </div>
                                </button>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-neutral-text-main block">
                                    {stats.totalVisitors > 0
                                        ? (stats.totalEngagements / stats.totalVisitors).toFixed(2)
                                        : '—'}
                                </span>
                                <span className="text-[8px] text-neutral-text-muted">per visitor</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between group relative">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Revenue Per Order</span>
                                <button className="text-neutral-text-muted hover:text-primary-main transition-colors p-0.5 group/hint">
                                    <FiInfo size={11} />
                                    <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-neutral-900 text-white text-[9px] rounded-lg shadow-xl z-50 pointer-events-none opacity-0 group-hover/hint:opacity-100 transition-opacity border border-white/10">
                                        Average revenue generated per order. (Total Revenue ÷ Total Orders)
                                    </div>
                                </button>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-primary-main block">
                                    {stats.totalOrders > 0
                                        ? `$${(stats.totalRevenue / stats.totalOrders).toFixed(2)}`
                                        : '—'}
                                </span>
                                <span className="text-[8px] text-neutral-text-muted">per order</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-premium p-4">
                    <h3 className="text-[11px] font-bold text-neutral-text-main titlecase tracking-[0.15em] mb-4 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-main mr-2"></div>
                        AI & Automation
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Active Campaigns</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.activeCampaigns}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Bot Executions</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.botExecutions}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">Knowledge Bases</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.knowledgeBases}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/30">
                            <span className="text-[10px] font-bold text-neutral-text-secondary titlecase tracking-wide">AI Models</span>
                            <span className="text-sm font-bold text-neutral-text-main">{stats.aiModels}</span>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-[9px] text-blue-700 font-semibold">
                                ℹ️ AI & automation features are actively configured for this merchant. {stats.botExecutions > 0 && `${stats.botExecutions} bot executions detected.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MerchantLevelDashboard;
