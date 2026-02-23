import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertTriangle, FiBell, FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';
import googleCloudConsoleService from '../services/googleCloudConsoleService';

type FeedType = 'success' | 'error' | 'warning' | 'info' | 'critical' | 'high' | 'medium' | 'low';

interface NotificationFeedItem {
  id: string;
  source: 'app' | 'gcp-alert' | 'gcp-notification';
  type: FeedType;
  title: string;
  message?: string;
  createdAt: string;
}

type FeedCategory = 'all' | 'alerts' | FeedType;

const HISTORY_KEY = 'app_notification_history';
const LAST_SEEN_KEY = 'app_notification_last_seen';
const CATEGORY_ORDER: FeedCategory[] = ['all', 'critical', 'error', 'high', 'warning', 'medium', 'info', 'success', 'low'];
const CATEGORY_LABELS: Record<FeedCategory, string> = {
  all: 'All',
  alerts: 'GCP Alerts',
  critical: 'Critical',
  error: 'Error',
  high: 'High',
  warning: 'Warning',
  medium: 'Medium',
  info: 'Info',
  success: 'Success',
  low: 'Low'
};

const toMillis = (iso: string) => {
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

const normalizeFeedType = (value: unknown): FeedType => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'critical' || raw === 'error' || raw === 'warning' || raw === 'info' || raw === 'success' || raw === 'high' || raw === 'medium' || raw === 'low') {
    return raw;
  }
  if (raw === 'warn') return 'warning';
  if (raw === 'err') return 'error';
  return 'info';
};

const getTypeStyles = (type: FeedType) => {
  if (type === 'success') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (type === 'error' || type === 'critical') return 'text-red-700 bg-red-50 border-red-200';
  if (type === 'warning' || type === 'high' || type === 'medium') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-blue-700 bg-blue-50 border-blue-200';
};

const getCategoryButtonStyles = (category: FeedCategory, active: boolean) => {
  if (category === 'all') {
    return active
      ? 'border-slate-300 text-slate-800 bg-slate-100 shadow-sm'
      : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50';
  }
  if (category === 'alerts' || category === 'critical' || category === 'error') {
    return active
      ? 'border-red-300 text-red-800 bg-red-100 shadow-sm'
      : 'border-red-200 text-red-700 bg-white hover:bg-red-50';
  }
  if (category === 'high' || category === 'warning' || category === 'medium') {
    return active
      ? 'border-amber-300 text-amber-900 bg-amber-100 shadow-sm'
      : 'border-amber-200 text-amber-800 bg-white hover:bg-amber-50';
  }
  if (category === 'success') {
    return active
      ? 'border-emerald-300 text-emerald-900 bg-emerald-100 shadow-sm'
      : 'border-emerald-200 text-emerald-800 bg-white hover:bg-emerald-50';
  }
  return active
    ? 'border-blue-300 text-blue-900 bg-blue-100 shadow-sm'
    : 'border-blue-200 text-blue-800 bg-white hover:bg-blue-50';
};

const getTypeIcon = (type: FeedType) => {
  if (type === 'success') return <FiCheckCircle size={14} />;
  if (type === 'error' || type === 'critical') return <FiXCircle size={14} />;
  if (type === 'warning' || type === 'high' || type === 'medium') return <FiAlertTriangle size={14} />;
  return <FiInfo size={14} />;
};

const getCategoryIcon = (category: FeedCategory) => {
  if (category === 'alerts' || category === 'critical' || category === 'error') return <FiXCircle size={12} />;
  if (category === 'high' || category === 'warning' || category === 'medium') return <FiAlertTriangle size={12} />;
  if (category === 'success') return <FiCheckCircle size={12} />;
  if (category === 'all') return <FiBell size={12} />;
  return <FiInfo size={12} />;
};

const readAppHistory = (): NotificationFeedItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      type: normalizeFeedType(item?.type)
    }));
  } catch {
    return [];
  }
};

const HeaderNotifications: React.FC = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('all');
  const [appItems, setAppItems] = useState<NotificationFeedItem[]>([]);
  const [gcpItems, setGcpItems] = useState<NotificationFeedItem[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(() => Number(localStorage.getItem(LAST_SEEN_KEY) || '0'));

  const refreshGcpFeed = async () => {
    try {
      const currentProject = new URLSearchParams(window.location.search).get('project') || undefined;
      const payload = await googleCloudConsoleService.getDashboardData(currentProject);
      const alerts = (payload.alerts || []).map((a) => ({
        id: `gcp-alert-${a.id}`,
        source: 'gcp-alert' as const,
        type: normalizeFeedType(a.severity),
        title: `Alert: ${a.title}`,
        message: `${a.service} - ${a.status}`,
        createdAt: a.createdAt
      }));
      const notes = (payload.notifications || []).map((n) => ({
        id: `gcp-note-${n.id}`,
        source: 'gcp-notification' as const,
        type: normalizeFeedType(n.type),
        title: 'Cloud Notification',
        message: n.message,
        createdAt: n.createdAt
      }));
      setGcpItems([...alerts, ...notes]);
    } catch {
      setGcpItems([]);
    }
  };

  useEffect(() => {
    const syncHistory = () => setAppItems(readAppHistory());
    const handleDocClick = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    syncHistory();
    refreshGcpFeed();
    const interval = setInterval(refreshGcpFeed, 20000);

    window.addEventListener('app-notification', syncHistory as EventListener);
    window.addEventListener('storage', syncHistory);
    document.addEventListener('mousedown', handleDocClick);

    return () => {
      clearInterval(interval);
      window.removeEventListener('app-notification', syncHistory as EventListener);
      window.removeEventListener('storage', syncHistory);
      document.removeEventListener('mousedown', handleDocClick);
    };
  }, []);

  const feedItems = useMemo(() => {
    return [...appItems, ...gcpItems].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  }, [appItems, gcpItems]);

  const unreadCount = useMemo(() => {
    return feedItems.filter(i => toMillis(i.createdAt) > lastSeen).length;
  }, [feedItems, lastSeen]);

  const unreadAlertCount = useMemo(() => {
    return feedItems.filter(i => i.source === 'gcp-alert' && toMillis(i.createdAt) > lastSeen).length;
  }, [feedItems, lastSeen]);

  const alertItems = useMemo(() => {
    return feedItems.filter(item => item.source === 'gcp-alert');
  }, [feedItems]);

  const notificationItems = useMemo(() => {
    return feedItems.filter(item => item.source !== 'gcp-alert');
  }, [feedItems]);

  const notificationsByType = useMemo(() => {
    const grouped: Partial<Record<FeedType, NotificationFeedItem[]>> = {};
    notificationItems.forEach(item => {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type]!.push(item);
    });
    return grouped;
  }, [notificationItems]);

  const unreadCategoryCounts = useMemo(() => {
    const counts: Record<FeedCategory, number> = {
      all: unreadCount,
      alerts: unreadAlertCount,
      critical: 0,
      error: 0,
      high: 0,
      warning: 0,
      medium: 0,
      info: 0,
      success: 0,
      low: 0
    };
    notificationItems.forEach((item) => {
      if (toMillis(item.createdAt) > lastSeen) {
        counts[item.type] += 1;
      }
    });
    return counts;
  }, [lastSeen, notificationItems, unreadAlertCount, unreadCount]);

  const categoryCounts = useMemo(() => {
    const counts: Record<FeedCategory, number> = {
      all: feedItems.length,
      alerts: alertItems.length,
      critical: 0,
      error: 0,
      high: 0,
      warning: 0,
      medium: 0,
      info: 0,
      success: 0,
      low: 0
    };
    (['critical', 'error', 'high', 'warning', 'medium', 'info', 'success', 'low'] as FeedType[]).forEach((type) => {
      counts[type] = (notificationsByType[type] || []).length;
    });
    return counts;
  }, [alertItems.length, feedItems.length, notificationsByType]);

  const visibleCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((category) => category === 'all' || categoryCounts[category] > 0);
  }, [categoryCounts]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return feedItems;
    if (activeCategory === 'alerts') return alertItems;
    return notificationItems.filter((item) => item.type === activeCategory);
  }, [activeCategory, alertItems, feedItems, notificationItems]);

  const togglePanel = (category: FeedCategory = 'all') => {
    setActiveCategory(category);
    const shouldOpen = !open || category !== activeCategory;
    setOpen(shouldOpen);
    if (shouldOpen) {
      const now = Date.now();
      localStorage.setItem(LAST_SEEN_KEY, String(now));
      setLastSeen(now);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-700 whitespace-nowrap">GCP Alerts</span>

        <button
          onClick={() => togglePanel('all')}
          className={`relative p-2 rounded-lg border transition-colors inline-flex items-center justify-center ${
            open && activeCategory === 'all'
              ? 'border-slate-300 text-slate-800 bg-slate-100'
              : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
          }`}
          title="Notifications & Alerts"
        >
          <FiBell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto">
          {visibleCategories
            .filter((category) => category !== 'all')
            .map((category) => (
              <button
                key={category}
                onClick={() => togglePanel(category)}
                className={`px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-colors inline-flex items-center gap-1.5 ${getCategoryButtonStyles(category, open && activeCategory === category)}`}
                title={`${CATEGORY_LABELS[category]} (${categoryCounts[category]})`}
              >
                {getCategoryIcon(category)}
                <span>{CATEGORY_LABELS[category]}</span>
                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-black/10">
                  {categoryCounts[category]}
                </span>
                {unreadCategoryCounts[category] > 0 && (
                  <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold inline-flex items-center justify-center">
                    {unreadCategoryCounts[category] > 99 ? '99+' : unreadCategoryCounts[category]}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wider text-gray-900 uppercase">Notifications & Alerts</h3>
            <span className="text-[10px] font-bold text-gray-500">{filteredItems.length} shown</span>
          </div>
          <div className="px-3 py-2 border-b border-gray-100 bg-white flex gap-1 overflow-x-auto">
            {visibleCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${getCategoryButtonStyles(category, activeCategory === category)}`}
              >
                {getCategoryIcon(category)}
                <span>{CATEGORY_LABELS[category]}</span>
                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-black/10">
                  {categoryCounts[category]}
                </span>
                {unreadCategoryCounts[category] > 0 && (
                  <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold inline-flex items-center justify-center">
                    {unreadCategoryCounts[category] > 99 ? '99+' : unreadCategoryCounts[category]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-sm font-semibold text-gray-500">No notifications yet.</div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredItems.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 inline-flex p-1 rounded border ${getTypeStyles(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-gray-900">{item.title}</p>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {item.message && <p className="text-[11px] text-gray-600 mt-1 break-words">{item.message}</p>}
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{item.source}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderNotifications;
