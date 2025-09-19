/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { z } from 'zod';

import { ISecurityEvent, ISecurityEventFilter, ISecurityEventSummary, SecurityEventType } from '../types/events.js';

const SecurityEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.enum([
    SecurityEventType.AUTH_SUCCESS,
    SecurityEventType.AUTH_FAILURE,
    SecurityEventType.TOKEN_REFRESH,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityEventType.INVALID_REQUEST,
    SecurityEventType.UNAUTHORIZED_ACCESS,
  ]),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  resource: z.string(),
  action: z.string(),
  success: z.boolean(),
  details: z.record(z.string(), z.any()).optional(),
  errorMessage: z.string().optional(),
});

export class SecurityAuditor {
  private events: ISecurityEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10k events in memory

  /**
   * Logs a security event with automatic ID generation and timestamp.
   * Validates the event data and maintains the event history limit.
   * @param event - The security event data (without id and timestamp)
   */
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

  /**
   * Generates a unique event ID for security events.
   * @returns A unique event identifier
   * @private
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persists a security event to external systems.
   * Currently a placeholder - in production would send to SIEM, database, etc.
   * @param _event - The security event to persist
   * @private
   */
  private persistEvent(_event: ISecurityEvent): void {
    // In a real implementation, this would:
    // - Send to SIEM system
    // - Write to audit database
    // - Send to monitoring service
    // For now, we'll just keep in memory
  }

  /**
   * Retrieves security events with optional filtering.
   * @param filter - Optional filter criteria for event retrieval
   * @param filter.type - Filter by security event type
   * @param filter.userId - Filter by user ID
   * @param filter.since - Filter events since this date
   * @param filter.limit - Limit the number of returned events
   * @returns Array of filtered security events
   */
  getEvents(filter?: ISecurityEventFilter): ISecurityEvent[] {
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

  /**
   * Generates a security summary with event counts and recent activity.
   * @returns Object containing security metrics and recent events
   */
  getSecuritySummary(): ISecurityEventSummary {
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
