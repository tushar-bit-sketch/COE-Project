import {
  ApiResponse,
  CameraSourceData,
  LoginRequest,
  SourceCreateInput,
  SourceUpdateInput,
  SystemHealthData,
  TargetData,
} from '@sentinel/shared';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('sentinel_jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error?.message || 'API request failed');
  }

  return json.data as T;
}

export const api = {
  // Auth
  login: (data: LoginRequest) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getSession: () => request<{ user: any }>('/auth/session'),

  // Sources
  getSources: () => request<{ sources: CameraSourceData[] }>('/sources'),
  getSource: (id: string) => request<{ source: CameraSourceData }>(`/sources/${id}`),
  createSource: (data: SourceCreateInput) =>
    request<{ source: CameraSourceData }>('/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSource: (id: string, data: SourceUpdateInput) =>
    request<{ source: CameraSourceData }>(`/sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSource: (id: string) =>
    request<{ message: string }>(`/sources/${id}`, { method: 'DELETE' }),
  testSource: (id: string) =>
    request<{ reachable: boolean; latencyMs: number; status: string; message: string }>(
      `/sources/${id}/test`,
      { method: 'POST' }
    ),
  startSource: (id: string) =>
    request<{ source: CameraSourceData }>(`/sources/${id}/start`, { method: 'POST' }),
  stopSource: (id: string) =>
    request<{ source: CameraSourceData }>(`/sources/${id}/stop`, { method: 'POST' }),

  // Targets
  getTargets: () =>
    request<{ targets: TargetData[]; count: number; lockedTargetId: number | null }>('/targets'),
  getTarget: (id: number) => request<{ target: TargetData }>(`/targets/${id}`),
  lockTarget: (id: number) =>
    request<{ locked: boolean; targetId: number; target: TargetData }>(`/targets/${id}/lock`, {
      method: 'POST',
    }),
  unlockTarget: (id: number) =>
    request<{ locked: boolean; targetId: number }>(`/targets/${id}/unlock`, {
      method: 'POST',
    }),
  getTargetHistory: (id: number) => request<any>(`/targets/${id}/history`),

  // Events & Alarms
  getEvents: (params?: { severity?: string; type?: string; acknowledged?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.set('severity', params.severity);
    if (params?.type) query.set('type', params.type);
    if (params?.acknowledged !== undefined) query.set('acknowledged', String(params.acknowledged));
    return request<{ anomalies: any[]; systemEvents: any[]; activeAlarms: any[] }>(
      `/events?${query.toString()}`
    );
  },
  acknowledgeEvent: (id: string, acknowledgedBy?: string) =>
    request<{ acknowledged: boolean; eventId: string }>(`/events/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledgedBy }),
    }),

  // System
  getSystemHealth: () => request<{ health: SystemHealthData }>('/system/health'),
  getSystemMetrics: () => request<any>('/system/metrics'),
  getSystemStatus: () => request<any>('/system/status'),
  updateSimulation: (data: { scenario?: string; speed?: number }) =>
    request<any>('/system/simulation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetSimulation: () => request<any>('/system/simulation/reset', { method: 'POST' }),
  toggleSimulationPause: () => request<{ paused: boolean }>('/system/simulation/pause', { method: 'POST' }),

  // Analytics
  getAnalyticsOverview: () => request<any>('/analytics/overview'),
  getDwellAnalytics: () => request<{ zones: any[] }>('/analytics/dwell'),
};
