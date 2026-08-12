import { apiClient } from './client';

/** Wraps GET /health (services/api/src/health.controller.ts, read from dist). */
export interface HealthStatus {
  status: string;
  database: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const { data } = await apiClient.get<HealthStatus>('/health');
  return data;
}
