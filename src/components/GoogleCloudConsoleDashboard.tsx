import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiActivity,
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiServer,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';
import googleCloudConsoleService, {
  GcpAlert,
  GcpApiStatus,
  GcpConsolePayload,
  GcpLiveEvent,
  GcpMetricPoint,
  GcpNotification,
  GcpOverview
} from '../services/googleCloudConsoleService';

const statusColorMap: Record<string, string> = {
  healthy: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  degraded: 'text-amber-700 bg-amber-50 border-amber-200',
  down: 'text-red-700 bg-red-50 border-red-200'
};

const severityColorMap: Record<string, string> = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low: 'text-blue-700 bg-blue-50 border-blue-200'
};

const eventColorMap: Record<string, string> = {
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-red-600'
};

const buildSparkline = (values: number[], width: number = 620, height: number = 180) => {
  if (!values.length) return { line: '', area: '' };
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = points.join(' ');
  const area = `0,${height} ${line} ${width},${height}`;
  return { line, area };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const int = parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
};

const GoogleCloudConsoleDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [overview, setOverview] = useState<GcpOverview | null>(null);
  const [apis, setApis] = useState<GcpApiStatus[]>([]);
  const [metrics, setMetrics] = useState<GcpMetricPoint[]>([]);
  const [alerts, setAlerts] = useState<GcpAlert[]>([]);
  const [notifications, setNotifications] = useState<GcpNotification[]>([]);
  const [events, setEvents] = useState<GcpLiveEvent[]>([]);
  const [selectedProject, setSelectedProject] = useState(searchParams.get('project') || '');

  const fetchDashboard = async (isAutoRefresh: boolean = false) => {
    if (!isAutoRefresh) setRefreshing(true);
    setError(null);
    try {
      const payload: GcpConsolePayload = await googleCloudConsoleService.getDashboardData(selectedProject || undefined);
      setOverview(payload.overview);
      setApis(payload.apis || []);
      setMetrics(payload.metrics || []);
      setAlerts(payload.alerts || []);
      setNotifications(payload.notifications || []);
      setEvents(payload.liveEvents || []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to load Google Cloud dashboard data');
    } finally {
      setLoading(false);
      if (!isAutoRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  useEffect(() => {
    setSelectedProject(searchParams.get('project') || '');
  }, [searchParams]);

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    if (value) setSearchParams({ project: value });
    else setSearchParams({});
  };

  const theme = useMemo(() => {
    const earth = {
      shellBg: 'linear-gradient(180deg, #f3f8ff 0%, #eef6ff 100%)',
      panel: '#ffffff',
      panelSoft: '#f5f9ff',
      panelSofter: '#fafcff',
      border: '#dbeafe',
      text: '#0f172a',
      muted: '#475569',
      accent: '#2563eb',
      accent2: '#0ea5e9',
      good: '#16a34a',
      warn: '#f59e0b'
    };
    const pluto = {
      shellBg: 'linear-gradient(180deg, #fff7ed 0%, #fff3e6 100%)',
      panel: '#ffffff',
      panelSoft: '#fff8ef',
      panelSofter: '#fffaf5',
      border: '#fde5cc',
      text: '#1f2937',
      muted: '#6b7280',
      accent: '#f59e0b',
      accent2: '#f97316',
      good: '#7c3aed',
      warn: '#ea580c'
    };
    return selectedProject === 'Pluto' ? pluto : earth;
  }, [selectedProject]);

  const displayProject = selectedProject || overview?.projectName || '-';
  const earthRegion = process.env.REACT_APP_GCP_REGION_EARTH || process.env.REACT_APP_GCP_EARTH_REGION || process.env.REACT_APP_GCP_REGION || 'us-central1';
  const plutoRegion = process.env.REACT_APP_GCP_REGION_PLUTO || process.env.REACT_APP_GCP_PLUTO_REGION || 'pluto-1';
  const displayRegion =
    selectedProject === 'Earth'
      ? earthRegion
      : selectedProject === 'Pluto'
        ? plutoRegion
        : (overview?.region || '-');

  const uptimePct = useMemo(() => {
    if (!overview) return 0;
    return overview.servicesTotal > 0
      ? Math.round((overview.servicesHealthy / overview.servicesTotal) * 100)
      : 0;
  }, [overview]);

  const projectOptions = useMemo(() => {
    const base = [overview?.projectName, 'Earth', 'Pluto'].filter(Boolean) as string[];
    return Array.from(new Set(base));
  }, [overview?.projectName]);

  const statusCounts = useMemo(() => {
    return apis.reduce(
      (acc, api) => {
        acc[api.status] += 1;
        return acc;
      },
      { healthy: 0, degraded: 0, down: 0 }
    );
  }, [apis]);

  const latencySeries = useMemo(() => {
    const eventLatencies = events.map(e => e.latencyMs).slice(-30);
    if (eventLatencies.length > 0) return eventLatencies;
    const apiLatencies = apis.map(a => a.latencyMs);
    return apiLatencies.length ? apiLatencies : [0];
  }, [events, apis]);

  const throughputSeries = useMemo(() => {
    if (!apis.length) return [];
    return [...apis]
      .map(a => ({ label: a.name, value: a.requestsPerMinute }))
      .sort((a, b) => b.value - a.value);
  }, [apis]);

  const alertSeverityBreakdown = useMemo(() => {
    const buckets = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach(alert => {
      if (alert.severity in buckets) buckets[alert.severity as keyof typeof buckets] += 1;
    });
    return buckets;
  }, [alerts]);

  const sparkline = useMemo(() => buildSparkline(latencySeries), [latencySeries]);
  const maxThroughput = useMemo(() => Math.max(...throughputSeries.map(s => s.value), 1), [throughputSeries]);
  const maxLatency = useMemo(() => Math.max(...latencySeries, 1), [latencySeries]);
  const accentRgb = useMemo(() => hexToRgb(theme.accent), [theme.accent]);
  const activeSignals = alerts.length + notifications.length + events.length;

  return (
    <div className="p-4 md:p-6 rounded-3xl space-y-5" style={{ background: theme.shellBg }}>
      <div className="rounded-3xl border shadow-sm p-5" style={{ background: theme.panel, borderColor: theme.border }}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: theme.accent }}>Cloud Operations</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1" style={{ color: theme.text }}>Google Cloud Command Center</h1>
            <p className="text-sm font-medium mt-2 max-w-3xl" style={{ color: theme.muted }}>
              Unified command surface for API reliability, latency behavior, incidents, and live operational activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="text-sm font-semibold border rounded-xl px-3 py-2.5 outline-none"
              style={{ background: theme.panelSoft, borderColor: theme.border, color: theme.text }}
            >
              <option value="">Select Project</option>
              {projectOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span
              className="inline-flex items-center gap-2 text-[12px] font-bold rounded-xl px-3 py-2 border"
              style={{ background: theme.panelSoft, borderColor: theme.border, color: theme.muted }}
            >
              <FiClock size={14} />
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not synced'}
            </span>
            <button
              onClick={() => fetchDashboard()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black disabled:opacity-60 transition-all"
              style={{ background: theme.accent, color: '#ffffff' }}
            >
              <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border p-10 text-center" style={{ background: theme.panel, borderColor: theme.border }}>
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: `${theme.accent}30`, borderTopColor: theme.accent }} />
          <p className="text-sm font-semibold" style={{ color: theme.muted }}>Loading live cloud telemetry...</p>
        </div>
      ) : !selectedProject ? (
        <div className="rounded-3xl border p-8" style={{ background: theme.panel, borderColor: theme.border }}>
          <h2 className="text-2xl font-black" style={{ color: theme.text }}>Choose A Project To Start Monitoring</h2>
          <p className="text-sm mt-2 font-medium max-w-2xl" style={{ color: theme.muted }}>
            Select a project from the left submenu or use one of the quick launches below to open a fully populated operations dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              { id: 'Earth', desc: 'Primary production telemetry, SLA and API reliability tracking.' },
              { id: 'Pluto', desc: 'Experimental workload monitoring, stress and anomaly behavior.' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleProjectChange(p.id)}
                className="text-left rounded-2xl border p-5 transition-all hover:shadow-md"
                style={{ borderColor: theme.border, background: theme.panelSoft }}
              >
                <p className="text-lg font-black" style={{ color: theme.text }}>{p.id}</p>
                <p className="text-sm font-medium mt-1" style={{ color: theme.muted }}>{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border p-4" style={{ background: theme.panel, borderColor: theme.border }}>
              <p className="text-[11px] uppercase tracking-widest font-black" style={{ color: theme.muted }}>Project / Region</p>
              <p className="text-xl font-black mt-2" style={{ color: theme.text }}>{displayProject}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: theme.muted }}>{displayRegion}</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ background: theme.panel, borderColor: theme.border }}>
              <p className="text-[11px] uppercase tracking-widest font-black" style={{ color: theme.muted }}>Live Services</p>
              <p className="text-2xl font-black mt-2" style={{ color: theme.good }}>{overview?.servicesHealthy || 0}/{overview?.servicesTotal || 0}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: theme.muted }}>Uptime {uptimePct}%</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ background: theme.panel, borderColor: theme.border }}>
              <p className="text-[11px] uppercase tracking-widest font-black" style={{ color: theme.muted }}>Incident Pressure</p>
              <p className="text-2xl font-black mt-2" style={{ color: theme.warn }}>{overview?.openAlerts || 0} / {overview?.activeIncidents || 0}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: theme.muted }}>Open alerts / active incidents</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ background: theme.panel, borderColor: theme.border }}>
              <p className="text-[11px] uppercase tracking-widest font-black" style={{ color: theme.muted }}>Live Signal Volume</p>
              <p className="text-2xl font-black mt-2" style={{ color: theme.accent }}>{activeSignals}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: theme.muted }}>Alerts + notifications + events</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-8 rounded-3xl border p-5" style={{ background: theme.panel, borderColor: theme.border }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black" style={{ color: theme.text }}>Latency Performance Curve</h2>
                  <p className="text-sm font-medium mt-1" style={{ color: theme.muted }}>
                    High-resolution trend of recent request latency with service health context.
                  </p>
                </div>
                <div className="rounded-xl px-3 py-2 border text-right" style={{ borderColor: theme.border, background: theme.panelSoft }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Avg Latency</p>
                  <p className="text-lg font-black" style={{ color: theme.text }}>{overview?.avgLatencyMs || 0} ms</p>
                </div>
              </div>
              <div className="rounded-2xl border p-3" style={{ borderColor: theme.border, background: theme.panelSofter }}>
                <svg viewBox="0 0 620 180" className="w-full h-56">
                  <defs>
                    <linearGradient id="latencyArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.accent} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={theme.accent} stopOpacity="0.04" />
                    </linearGradient>
                  </defs>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <line
                      key={`grid-${i}`}
                      x1="0"
                      y1={i * 30}
                      x2="620"
                      y2={i * 30}
                      stroke={theme.border}
                      strokeDasharray="3 4"
                    />
                  ))}
                  <polyline points={sparkline.area} fill="url(#latencyArea)" stroke="none" />
                  <polyline points={sparkline.line} fill="none" stroke={theme.accent} strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <MetricTile label="MIN" value={`${Math.min(...latencySeries)} ms`} theme={theme} />
                <MetricTile
                  label="AVG"
                  value={`${Math.round(latencySeries.reduce((a, b) => a + b, 0) / Math.max(latencySeries.length, 1))} ms`}
                  theme={theme}
                />
                <MetricTile label="MAX" value={`${Math.max(...latencySeries)} ms`} theme={theme} />
              </div>
            </div>

            <div className="xl:col-span-4 rounded-3xl border p-5" style={{ background: theme.panel, borderColor: theme.border }}>
              <h2 className="text-lg font-black" style={{ color: theme.text }}>Service Health Composition</h2>
              <p className="text-sm font-medium mt-1 mb-4" style={{ color: theme.muted }}>
                Proportional health split across active monitored APIs.
              </p>
              <div className="flex items-center justify-center">
                <div
                  className="w-48 h-48 rounded-full relative"
                  style={{
                    background: `conic-gradient(#10b981 0 ${Math.round((statusCounts.healthy / Math.max(apis.length, 1)) * 360)}deg, #f59e0b ${Math.round((statusCounts.healthy / Math.max(apis.length, 1)) * 360)}deg ${Math.round(((statusCounts.healthy + statusCounts.degraded) / Math.max(apis.length, 1)) * 360)}deg, #ef4444 ${Math.round(((statusCounts.healthy + statusCounts.degraded) / Math.max(apis.length, 1)) * 360)}deg 360deg)`
                  }}
                >
                  <div
                    className="absolute inset-5 rounded-full flex flex-col items-center justify-center border"
                    style={{ background: theme.panel, borderColor: theme.border }}
                  >
                    <p className="text-4xl font-black" style={{ color: theme.text }}>{uptimePct}%</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Uptime</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <HealthRow label="Healthy" value={statusCounts.healthy} total={Math.max(apis.length, 1)} color="#10b981" theme={theme} />
                <HealthRow label="Degraded" value={statusCounts.degraded} total={Math.max(apis.length, 1)} color="#f59e0b" theme={theme} />
                <HealthRow label="Down" value={statusCounts.down} total={Math.max(apis.length, 1)} color="#ef4444" theme={theme} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-7 rounded-3xl border overflow-hidden" style={{ background: theme.panel, borderColor: theme.border }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: theme.border, background: theme.panelSoft }}>
                <h2 className="text-base font-black" style={{ color: theme.text }}>API Reliability Matrix</h2>
                <p className="text-sm font-medium mt-1" style={{ color: theme.muted }}>Status, error rate, latency and throughput in one operational table.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: theme.panelSoft, color: theme.muted }} className="uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-2.5">Service</th>
                      <th className="text-left px-4 py-2.5">Status</th>
                      <th className="text-left px-4 py-2.5">Error</th>
                      <th className="text-left px-4 py-2.5">Latency</th>
                      <th className="text-left px-4 py-2.5">RPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apis.map(api => (
                      <tr key={api.name} className="border-t" style={{ borderColor: theme.border }}>
                        <td className="px-4 py-3 font-bold" style={{ color: theme.text }}>{api.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-md border text-[10px] font-bold uppercase ${statusColorMap[api.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {api.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: theme.muted }}>{api.errorRate.toFixed(2)}%</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: theme.muted }}>{api.latencyMs} ms</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: theme.muted }}>{api.requestsPerMinute}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="xl:col-span-5 rounded-3xl border p-5" style={{ background: theme.panel, borderColor: theme.border }}>
              <h2 className="text-base font-black" style={{ color: theme.text }}>Alert Severity + Throughput</h2>
              <p className="text-sm font-medium mt-1 mb-4" style={{ color: theme.muted }}>
                Incidents, pressure, and load concentration.
              </p>
              {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
                const total = Math.max(alerts.length, 1);
                const value = alertSeverityBreakdown[severity];
                const pct = Math.round((value / total) * 100);
                const color = severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f97316' : severity === 'medium' ? '#f59e0b' : '#3b82f6';
                return (
                  <div key={severity} className="mb-3">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.muted }}>
                      <span>{severity}</span>
                      <span>{value}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: theme.panelSoft }}>
                      <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
              <div className="mt-4">
                {throughputSeries.slice(0, 5).map((series) => {
                  const width = Math.round((series.value / maxThroughput) * 100);
                  return (
                    <div key={series.label} className="mb-2">
                      <div className="flex items-center justify-between text-[12px] font-semibold mb-1" style={{ color: theme.muted }}>
                        <span>{series.label}</span>
                        <span>{series.value}</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: theme.panelSoft }}>
                        <div className="h-2 rounded-full" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4 rounded-3xl border p-5" style={{ background: theme.panel, borderColor: theme.border }}>
              <h2 className="text-base font-black" style={{ color: theme.text }}>Latency Heatmap</h2>
              <p className="text-sm font-medium mt-1 mb-4" style={{ color: theme.muted }}>Hotspot intensity across recent windows.</p>
              <div className="grid grid-cols-6 gap-1.5">
                {latencySeries.slice(-24).map((value, idx) => {
                  const intensity = clamp(value / maxLatency, 0.1, 1);
                  return (
                    <div
                      key={`h-${idx}`}
                      className="h-7 rounded-md border"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${intensity})`
                      }}
                      title={`${value} ms`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-4 rounded-3xl border overflow-hidden" style={{ background: theme.panel, borderColor: theme.border }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: theme.border, background: theme.panelSoft }}>
                <FiAlertTriangle style={{ color: theme.warn }} />
                <h2 className="text-base font-black" style={{ color: theme.text }}>Alerts</h2>
              </div>
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {alerts.length === 0 && <p className="text-sm" style={{ color: theme.muted }}>No active alerts.</p>}
                {alerts.map(alert => (
                  <div key={alert.id} className="rounded-xl border p-3" style={{ borderColor: theme.border, background: theme.panelSofter }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: theme.text }}>{alert.title}</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: theme.muted }}>{alert.service} • {new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-md border text-[10px] font-bold uppercase ${severityColorMap[alert.severity] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-4 rounded-3xl border overflow-hidden" style={{ background: theme.panel, borderColor: theme.border }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: theme.border, background: theme.panelSoft }}>
                <FiBell style={{ color: theme.accent }} />
                <h2 className="text-base font-black" style={{ color: theme.text }}>Notifications</h2>
              </div>
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {notifications.length === 0 && <p className="text-sm" style={{ color: theme.muted }}>No notifications.</p>}
                {notifications.map(note => (
                  <div key={note.id} className="rounded-xl border p-3" style={{ borderColor: theme.border, background: theme.panelSofter }}>
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>{note.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs font-medium" style={{ color: theme.muted }}>{new Date(note.createdAt).toLocaleString()}</p>
                      <span className={`text-[10px] font-black uppercase ${note.type === 'critical' ? 'text-red-600' : note.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                        {note.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border overflow-hidden" style={{ background: theme.panel, borderColor: theme.border }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: theme.border, background: theme.panelSoft }}>
              <FiTrendingUp style={{ color: theme.good }} />
              <h2 className="text-base font-black" style={{ color: theme.text }}>Live Event Stream</h2>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase font-bold rounded-md px-2 py-1 border" style={{ color: '#15803d', background: '#ecfdf3', borderColor: '#bbf7d0' }}>
                <FiCheckCircle size={11} />
                Live
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="uppercase text-[10px] tracking-wider" style={{ background: theme.panelSoft, color: theme.muted }}>
                  <tr>
                    <th className="text-left px-4 py-2.5">Timestamp</th>
                    <th className="text-left px-4 py-2.5">Service</th>
                    <th className="text-left px-4 py-2.5">Action</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-left px-4 py-2.5">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev.id} className="border-t" style={{ borderColor: theme.border }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: theme.muted }}>{new Date(ev.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: theme.text }}>{ev.service}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: theme.muted }}>{ev.action}</td>
                      <td className={`px-4 py-3 font-bold uppercase text-[11px] ${eventColorMap[ev.status] || 'text-gray-600'}`}>{ev.status}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: theme.muted }}>{ev.latencyMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MetricTile: React.FC<{ label: string; value: string; theme: any }> = ({ label, value, theme }) => (
  <div className="rounded-xl border px-3 py-2" style={{ borderColor: theme.border, background: theme.panelSoft }}>
    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.muted }}>{label}</p>
    <p className="text-lg font-black mt-1" style={{ color: theme.text }}>{value}</p>
  </div>
);

const HealthRow: React.FC<{ label: string; value: number; total: number; color: string; theme: any }> = ({ label, value, total, color, theme }) => {
  const pct = Math.round((value / Math.max(total, 1)) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.muted }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: theme.panelSoft }}>
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export default GoogleCloudConsoleDashboard;
