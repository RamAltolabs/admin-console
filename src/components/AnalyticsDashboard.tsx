import React, { useState, useEffect, useRef } from 'react';
import { FiTrendingUp, FiUsers, FiMessageSquare, FiMaximize2, FiLayout, FiRotateCcw } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface AnalyticsDashboardProps {
    cluster?: string;
}

type TabType = 'visitor' | 'engagement' | 'conversation';

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ cluster }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('visitor');
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [visitorDashboardUrl, setVisitorDashboardUrl] = useState<string>('');
    const [engagementDashboardUrl, setEngagementDashboardUrl] = useState<string>('');
    const [conversationDashboardUrl, setConversationDashboardUrl] = useState<string>('');
    const lastFetchedRef = useRef<string>('');

    const fetchAnalytics = async (tabToFetch?: TabType) => {
        const targetTab = tabToFetch || activeTab;
        setLoading(true);
        try {
            let response;
            switch (targetTab) {
                case 'visitor':
                    response = await merchantService.getVisitorAnalytics(cluster, startDate, endDate);
                    setVisitorDashboardUrl(response?.iframeUrl || '');
                    break;
                case 'engagement':
                    response = await merchantService.getEngagementAnalytics(cluster, startDate, endDate);
                    setEngagementDashboardUrl(response?.iframeUrl || '');
                    break;
                case 'conversation':
                    response = await merchantService.getConversationAnalytics(cluster, startDate, endDate);
                    setConversationDashboardUrl(response?.iframeUrl || '');
                    break;
            }

        } catch (error) {
            console.error(`Failed to fetch ${targetTab} analytics:`, error);
        } finally {
            setLoading(false);
        }
    };

    // Unified Effect: Fetch only when missing OR filter/tab changes
    useEffect(() => {
        if (!cluster) return;

        const currentUrl = activeTab === 'visitor' ? visitorDashboardUrl :
            activeTab === 'engagement' ? engagementDashboardUrl :
                conversationDashboardUrl;
        const fetchKey = `${cluster}-${startDate}-${endDate}-${activeTab}`;

        // Only fetch if data is missing AND we haven't just fetched it
        if (!currentUrl && lastFetchedRef.current !== fetchKey) {
            lastFetchedRef.current = fetchKey;
            fetchAnalytics(activeTab);
        }
    }, [cluster, startDate, endDate, activeTab, visitorDashboardUrl, engagementDashboardUrl, conversationDashboardUrl]);

    // Clear caches when cluster or dates change to force a re-fetch via the effect above
    useEffect(() => {
        setVisitorDashboardUrl('');
        setEngagementDashboardUrl('');
        setConversationDashboardUrl('');
    }, [cluster, startDate, endDate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-neutral-border min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-main border-t-transparent mb-4"></div>
                <p className="text-[10px] font-bold text-neutral-text-muted titlecase tracking-widest">Synchronizing Analytics...</p>
            </div>
        );
    }

    const tabs: { id: TabType; label: string; icon: any; color: string; url: string }[] = [
        { id: 'visitor', label: 'Visitors', icon: FiUsers, color: '#0052cc', url: visitorDashboardUrl },
        { id: 'engagement', label: 'Engagement', icon: FiTrendingUp, color: '#36b37e', url: engagementDashboardUrl },
        { id: 'conversation', label: 'Conversations', icon: FiMessageSquare, color: '#6554c0', url: conversationDashboardUrl },
    ];

    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <div className="space-y-4">
            {/* Minimal Filter & Tab Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-3 rounded-xl border border-neutral-border shadow-sm">
                {/* Tabs on the Left */}
                <div className="flex overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all relative whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary-main text-primary-main'
                                : 'border-transparent text-neutral-text-muted hover:text-neutral-text-main'
                                }`}
                        >
                            <tab.icon size={14} />
                            <span className="text-[10px] font-bold titlecase tracking-[0.15em]">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Controls: Date Range, External Link, and Refresh */}
                <div className="flex items-center gap-3 ml-auto">
                    {currentTab?.url && (
                        <a
                            href={(() => {
                                let url = currentTab.url;
                                const baseUrl = url.split('#')[0];
                                const fragment = url.split('#')[1] || '';
                                let newBaseUrl = baseUrl;
                                const queryParams = ['logo=false', 'bordered=false', 'titled=false'];
                                queryParams.forEach(param => {
                                    if (!newBaseUrl.includes(param)) {
                                        newBaseUrl += (newBaseUrl.includes('?') ? '&' : '?') + param;
                                    }
                                });
                                let newFragment = fragment;
                                queryParams.forEach(param => {
                                    if (!newFragment.includes(param)) {
                                        newFragment += (newFragment ? '&' : '') + param;
                                    }
                                });
                                return `${newBaseUrl}#${newFragment}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold text-primary-main bg-primary-main/5 hover:bg-primary-main/10 transition-all titlecase tracking-widest border border-primary-main/10"
                            title="Open in Metabase"
                        >
                            <FiMaximize2 size={12} />
                            External View
                        </a>
                    )}
                    <div className="flex items-center gap-2 bg-neutral-bg/30 px-2 py-1 rounded-lg border border-neutral-border/50">
                        <span className="text-[9px] font-bold text-neutral-text-muted titlecase">Range:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-0 text-[10px] font-bold text-neutral-text-main focus:ring-0 p-0 outline-none w-[95px]"
                        />
                        <span className="text-neutral-text-muted text-[10px]">—</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-0 text-[10px] font-bold text-neutral-text-main focus:ring-0 p-0 outline-none w-[95px]"
                        />
                    </div>
                    <button
                        onClick={() => fetchAnalytics(activeTab)}
                        className="p-2 bg-primary-main text-white rounded-lg hover:bg-black transition-all shadow-md active:scale-95 group"
                        title="Refresh Data"
                    >
                        <FiRotateCcw size={14} className="group-active:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* Analytics Content */}
            <div className="card-premium overflow-hidden bg-white shadow-xl border border-neutral-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {currentTab?.url ? (
                    <div>
                        <div className="relative h-[710px] w-full bg-[#f4f5f7]/20 overflow-hidden rounded-b-xl border-t border-neutral-border/30">
                            <iframe
                                key={`${currentTab.id}-${cluster}-${startDate}-${endDate}`}
                                src={(() => {
                                    let url = currentTab.url;

                                    // Add logic params to query string first (for some versions)
                                    const baseUrl = url.split('#')[0];
                                    const fragment = url.split('#')[1] || '';

                                    let newBaseUrl = baseUrl;
                                    const queryParams = ['logo=false', 'bordered=false', 'titled=false'];

                                    queryParams.forEach(param => {
                                        if (!newBaseUrl.includes(param)) {
                                            newBaseUrl += (newBaseUrl.includes('?') ? '&' : '?') + param;
                                        }
                                    });

                                    // Also add to fragment (for most versions)
                                    let newFragment = fragment;
                                    queryParams.forEach(param => {
                                        if (!newFragment.includes(param)) {
                                            newFragment += (newFragment ? '&' : '') + param;
                                        }
                                    });

                                    return `${newBaseUrl}#${newFragment}`;
                                })()}
                                className="w-full h-[780px] border-0"
                                style={{
                                    marginTop: '-1px', // Hide potential top border shift
                                    marginBottom: '-70px' // Ensure bottom branding is pushed out of clip
                                }}
                                title={`${currentTab.label} Analytics`}
                                sandbox="allow-same-origin allow-scripts allow-forms"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center bg-white">
                        <div className="w-12 h-12 bg-neutral-bg rounded-2xl flex items-center justify-center mb-4 rotate-3 shadow-inner">
                            <FiLayout className="text-neutral-text-muted" size={24} />
                        </div>
                        <h4 className="text-[11px] font-bold text-neutral-text-main titlecase tracking-widest mb-2">Endpoint Unavailable</h4>
                        <p className="text-[10px] text-neutral-text-muted font-bold titlecase max-w-[200px] leading-relaxed">
                            No {currentTab?.label.toLowerCase()} metrics found for this period.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
