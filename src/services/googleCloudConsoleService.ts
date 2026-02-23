import axios from 'axios';

export interface GcpOverview {
  projectName: string;
  region: string;
  servicesHealthy: number;
  servicesTotal: number;
  activeIncidents: number;
  openAlerts: number;
  apiSuccessRate: number;
  requestsPerMinute: number;
  avgLatencyMs: number;
}

export interface GcpApiStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  errorRate: number;
  latencyMs: number;
  requestsPerMinute: number;
  updatedAt: string;
}

export interface GcpMetricPoint {
  label: string;
  value: number;
  unit: '%' | 'ms' | 'rps';
}

export interface GcpAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  service: string;
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
}

export interface GcpNotification {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: string;
}

export interface GcpLiveEvent {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  status: 'success' | 'warning' | 'error';
  latencyMs: number;
}

export interface GcpConsolePayload {
  overview: GcpOverview;
  apis: GcpApiStatus[];
  metrics: GcpMetricPoint[];
  alerts: GcpAlert[];
  notifications: GcpNotification[];
  liveEvents: GcpLiveEvent[];
}

const normalizeBaseURL = (value: string) => String(value || '').replace(/\/+$/, '');

const getProjectBaseURL = (project?: string): string => {
  const normalized = String(project || '').trim().toLowerCase();
  const earthBase = normalizeBaseURL(
    process.env.REACT_APP_GCP_CONSOLE_EARTH_API_BASE_URL
    || process.env.REACT_APP_GCP_CONSOLE_API_BASE_URL_EARTH
    || ''
  );
  const plutoBase = normalizeBaseURL(
    process.env.REACT_APP_GCP_CONSOLE_PLUTO_API_BASE_URL
    || process.env.REACT_APP_GCP_CONSOLE_API_BASE_URL_PLUTO
    || ''
  );
  const nebulaBase = normalizeBaseURL(
    process.env.REACT_APP_GCP_CONSOLE_NEBULA_API_BASE_URL
    || process.env.REACT_APP_GCP_CONSOLE_API_BASE_URL_NEBULA
    || ''
  );
  const fallback = normalizeBaseURL(process.env.REACT_APP_GCP_CONSOLE_API_BASE_URL || '');

  if (normalized === 'earth') return earthBase || fallback;
  if (normalized === 'pluto') return plutoBase || fallback;
  if (normalized === 'nebula') return nebulaBase || fallback;
  return fallback;
};

const createFallbackPayload = (project?: string): GcpConsolePayload => {
  const now = new Date();
  const jitter = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  const ts = () => new Date(now.getTime() - jitter(5, 600) * 1000).toISOString();

  const apis: GcpApiStatus[] = [
    { name: 'Cloud Run', status: 'healthy', errorRate: 0.12, latencyMs: jitter(120, 180), requestsPerMinute: jitter(850, 1080), updatedAt: ts() },
    { name: 'Cloud Functions', status: 'healthy', errorRate: 0.18, latencyMs: jitter(140, 220), requestsPerMinute: jitter(620, 890), updatedAt: ts() },
    { name: 'Pub/Sub', status: 'degraded', errorRate: 1.42, latencyMs: jitter(210, 340), requestsPerMinute: jitter(450, 710), updatedAt: ts() },
    { name: 'Cloud SQL', status: 'healthy', errorRate: 0.09, latencyMs: jitter(70, 130), requestsPerMinute: jitter(320, 490), updatedAt: ts() }
  ];

  const alerts: GcpAlert[] = [
    { id: 'a1', severity: 'critical', title: 'Error rate spike detected', service: 'Pub/Sub', status: 'open', createdAt: ts() },
    { id: 'a2', severity: 'high', title: 'CPU utilization above threshold', service: 'Cloud Run', status: 'acknowledged', createdAt: ts() },
    { id: 'a3', severity: 'medium', title: 'Latency elevated for API gateway', service: 'Cloud Functions', status: 'open', createdAt: ts() }
  ];

  const notifications: GcpNotification[] = [
    { id: 'n1', type: 'critical', message: 'Incident INC-2391 created for Pub/Sub error rate.', createdAt: ts() },
    { id: 'n2', type: 'warning', message: 'Budget burn rate exceeded 80% for this month.', createdAt: ts() },
    { id: 'n3', type: 'info', message: 'New deployment completed for cloud-run-recommender.', createdAt: ts() }
  ];

  const liveEvents: GcpLiveEvent[] = Array.from({ length: 8 }).map((_, i) => ({
    id: `e-${i}`,
    timestamp: ts(),
    service: ['Cloud Run', 'Cloud Functions', 'Pub/Sub', 'Cloud SQL'][i % 4],
    action: ['Request', 'Publish', 'Read', 'Deploy'][i % 4],
    status: (['success', 'warning', 'success', 'error'] as const)[i % 4],
    latencyMs: jitter(60, 360)
  }));

  const healthy = apis.filter(a => a.status === 'healthy').length;
  const normalizedProject = String(project || '').trim().toLowerCase();
  const fallbackProjectName = normalizedProject === 'earth'
    ? (process.env.REACT_APP_GCP_PROJECT_ID_EARTH || process.env.REACT_APP_GCP_EARTH_PROJECT_ID || 'earth')
    : normalizedProject === 'pluto'
      ? (process.env.REACT_APP_GCP_PROJECT_ID_PLUTO || process.env.REACT_APP_GCP_PLUTO_PROJECT_ID || 'pluto')
      : normalizedProject === 'nebula'
        ? (process.env.REACT_APP_GCP_PROJECT_ID_NEBULA || process.env.REACT_APP_GCP_NEBULA_PROJECT_ID || 'nebula')
        : (String(project || '').trim() || process.env.REACT_APP_GCP_PROJECT_ID || 'gcp-production');
  const fallbackRegion = String(project || '').trim().toLowerCase() === 'pluto'
    ? (process.env.REACT_APP_GCP_REGION_PLUTO || process.env.REACT_APP_GCP_PLUTO_REGION || 'pluto-1')
    : String(project || '').trim().toLowerCase() === 'nebula'
      ? (process.env.REACT_APP_GCP_REGION_NEBULA || process.env.REACT_APP_GCP_NEBULA_REGION || 'us-east1')
    : (process.env.REACT_APP_GCP_REGION_EARTH || process.env.REACT_APP_GCP_EARTH_REGION || process.env.REACT_APP_GCP_REGION || 'us-central1');

  const overview: GcpOverview = {
    projectName: fallbackProjectName,
    region: fallbackRegion,
    servicesHealthy: healthy,
    servicesTotal: apis.length,
    activeIncidents: alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length,
    openAlerts: alerts.filter(a => a.status === 'open').length,
    apiSuccessRate: Number((100 - apis.reduce((acc, a) => acc + a.errorRate, 0) / apis.length).toFixed(2)),
    requestsPerMinute: apis.reduce((acc, a) => acc + a.requestsPerMinute, 0),
    avgLatencyMs: Math.round(apis.reduce((acc, a) => acc + a.latencyMs, 0) / apis.length)
  };

  const metrics: GcpMetricPoint[] = [
    { label: 'CPU', value: jitter(38, 82), unit: '%' },
    { label: 'Memory', value: jitter(42, 79), unit: '%' },
    { label: 'Error Rate', value: Number((Math.random() * 3.2).toFixed(2)), unit: '%' },
    { label: 'P95 Latency', value: jitter(160, 420), unit: 'ms' },
    { label: 'Throughput', value: jitter(220, 540), unit: 'rps' }
  ];

  return { overview, apis, metrics, alerts, notifications, liveEvents };
};

class GoogleCloudConsoleService {
  private async getFromProxy<T>(path: string, project?: string): Promise<T | null> {
    const apiBaseURL = getProjectBaseURL(project);
    if (!apiBaseURL) return null;
    try {
      const token = localStorage.getItem('auth_token') || '';
      const response = await axios.get<T>(`${apiBaseURL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      return response.data;
    } catch {
      return null;
    }
  }

  async getDashboardData(project?: string): Promise<GcpConsolePayload> {
    const data = await this.getFromProxy<GcpConsolePayload>('/dashboard', project);
    return data || createFallbackPayload(project);
  }
}

export default new GoogleCloudConsoleService();
