import { z } from 'zod';

import { ISecurityEvent, SecurityEventType } from '../types/events.js';

const SecurityEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.nativeEnum(SecurityEventType),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  resource: z.string(),
  action: z.string(),
  success: z.boolean(),
  details: z.record(z.any()).optional(),
  errorMessage: z.string().optional(),
});

export class SecurityAuditor {
  private events: ISecurityEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10k events in memory

  logEvent(event: Omit<ISecurityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: ISecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Validate event
    SecurityEventSchema.parse(fullEvent);

    this.events.push(fullEvent);

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development (use warn so eslint no-console rule permits it)
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[SECURITY] ${event.type}: ${event.resource} - ${event.action} (${event.success === true ? 'SUCCESS' : 'FAILED'})`
      );
    }

    // In production, this would send to external logging service
    this.persistEvent(fullEvent);
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistEvent(_event: ISecurityEvent): void {
    // In a real implementation, this would:
    // - Send to SIEM system
    // - Write to audit database
    // - Send to monitoring service
    // For now, we'll just keep in memory
  }

  getEvents(filter?: { type?: SecurityEventType; userId?: string; since?: Date; limit?: number }): ISecurityEvent[] {
    let filtered = this.events;

    if (filter && filter.type !== undefined) {
      filtered = filtered.filter((e) => e.type === filter.type);
    }

    if (filter && filter.userId !== undefined) {
      filtered = filtered.filter((e) => e.userId === filter.userId);
    }

    if (filter && filter.since !== undefined) {
      const since = filter.since as Date;
      filtered = filtered.filter((e) => e.timestamp >= since);
    }

    if (filter && filter.limit !== undefined) {
      const limit = filter.limit as number;
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  getSecuritySummary(): {
    totalEvents: number;
    authSuccessCount: number;
    authFailureCount: number;
    rateLimitCount: number;
    recentEvents: ISecurityEvent[];
  } {
    const recentEvents = this.events.slice(-100); // Last 100 events

    return {
      totalEvents: this.events.length,
      authSuccessCount: this.events.filter((e) => e.type === SecurityEventType.AUTH_SUCCESS).length,
      authFailureCount: this.events.filter((e) => e.type === SecurityEventType.AUTH_FAILURE).length,
      rateLimitCount: this.events.filter((e) => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED).length,
      recentEvents,
    };
  }
}

// Global security auditor instance
export const securityAuditor = new SecurityAuditor();
