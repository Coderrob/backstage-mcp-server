export enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  TOKEN_REFRESH = 'token_refresh',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_REQUEST = 'invalid_request',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

export interface ISecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  action: string;
  success: boolean;
  details?: Record<string, unknown>;
  errorMessage?: string;
}

export interface ISecurityEventFilter {
  type?: SecurityEventType;
  userId?: string;
  since?: Date;
  limit?: number;
}

export interface ISecurityEventSummary {
  totalEvents: number;
  authSuccessCount: number;
  authFailureCount: number;
  rateLimitCount: number;
  recentEvents: ISecurityEvent[];
}
