import React, { useState, useEffect } from 'react';
import { FiSend, FiRefreshCw, FiSearch, FiCalendar, FiUsers, FiCheckCircle, FiClock, FiXCircle, FiZap, FiBarChart } from 'react-icons/fi';
import merchantService from '../services/merchantService';

interface CampaignsCardProps {
    merchantId: string;
    cluster?: string;
}

const CampaignsCard: React.FC<CampaignsCardProps> = ({ merchantId, cluster }) => {
    const [iframeUrl, setIframeUrl] = useState('');
    const [loading, setLoading] = useState(true);

    // Date range state
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 1);
        return { start, end };
    });
    const [selectedPreset, setSelectedPreset] = useState('1m');

    const handlePresetChange = (preset: string) => {
        setSelectedPreset(preset);
        const end = new Date();
        const start = new Date();

        if (preset === '1m') start.setMonth(end.getMonth() - 1);
        else if (preset === '3m') start.setMonth(end.getMonth() - 3);
        else if (preset === '6m') start.setMonth(end.getMonth() - 6);

        setDateRange({ start, end });
    };

    const fetchCampaignDashboard = async () => {
        setLoading(true);
        try {
            const startStr = dateRange.start.toISOString().split('T')[0];
            const endStr = dateRange.end.toISOString().split('T')[0];

            const response = await merchantService.getGenericAnalytics(
                'IT_CAMPAIGN',
                cluster,
                startStr,
                endStr,
                merchantId
            );

            if (response?.iframeUrl) {
                let url = response.iframeUrl;
                const baseUrl = url.split('#')[0];
                const fragment = url.split('#')[1] || '';
                let newBaseUrl = baseUrl;
                const queryParams = ['logo=false', 'bordered=false', 'titled=false'];
                queryParams.forEach((param: string) => {
                    if (!newBaseUrl.includes(param)) {
                        newBaseUrl += (newBaseUrl.includes('?') ? '&' : '?') + param;
                    }
                });
                let newFragment = fragment;
                queryParams.forEach((param: string) => {
                    if (!newFragment.includes(param)) {
                        newFragment += (newFragment ? '&' : '') + param;
                    }
                });
                setIframeUrl(`${newBaseUrl}#${newFragment}`);
            } else {
                setIframeUrl('');
            }
        } catch (error) {
            setIframeUrl('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaignDashboard();
    }, [merchantId, cluster, dateRange]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
                    {[
                        { id: '1m', label: '1M' },
                        { id: '3m', label: '3M' },
                        { id: '6m', label: '6M' }
                    ].map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handlePresetChange(preset.id)}
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selectedPreset === preset.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {iframeUrl && (
                        <a
                            href={iframeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                            Open External ↗
                        </a>
                    )}
                    <button
                        onClick={fetchCampaignDashboard}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Campaign Dashboard */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[550px] flex flex-col">
                <div className="flex-1 relative bg-gray-50/50">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4 shadow-sm"></div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider animate-pulse">Loading Campaigns...</p>
                        </div>
                    ) : iframeUrl ? (
                        <iframe
                            key={`campaigns-${merchantId}-${dateRange.start}-${dateRange.end}`}
                            src={iframeUrl}
                            className="w-full h-[550px] border-0"
                            title="Campaign Analytics"
                            sandbox="allow-same-origin allow-scripts allow-forms"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
                                <FiSend className="text-gray-300" size={32} />
                            </div>
                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-3">No Campaign Data</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase max-w-[280px] leading-relaxed">
                                Campaign analytics dashboard is currently unavailable for this merchant.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignsCard;
