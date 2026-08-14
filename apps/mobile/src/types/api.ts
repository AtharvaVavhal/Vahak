/**
 * Error body shape produced by the backend's global exception filter
 * (services/api/src/shared/filters/all-exceptions.filter.ts) for every non-2xx response.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}
