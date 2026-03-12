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

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ISecurityEvent, ISecurityEventSummary, SecurityEventType } from '../../shared/types/events.js';
import { SecurityAuditor } from './security-auditor.js';

type SecurityAuditorWithPrivate = {
  maxEvents: number;
  generateEventId(): string;
  logEvent(event: unknown): void;
  filterEvents(filter?: unknown): ISecurityEvent[];
  getSecuritySummary(): ISecurityEventSummary;
};

describe('SecurityAuditor', () => {
  let auditor: SecurityAuditorWithPrivate;

  beforeEach(() => {
    auditor = new SecurityAuditor() as unknown as SecurityAuditorWithPrivate;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logEvent', () => {
    it('should log valid event', () => {
      const event = {
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        resource: 'api/login',
        action: 'login',
        success: true,
        details: { method: 'password' },
      };

      auditor.logEvent(event);

      const events = auditor.filterEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject(event);
      expect(events[0].id).toMatch(/^sec_\d+_[a-z0-9]+$/);
      expect(events[0].timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for invalid event', () => {
      const invalidEvent = {
        type: 'invalid' as unknown as SecurityEventType,
        resource: 'api/login',
        action: 'login',
        success: true,
      };

      expect(() => auditor.logEvent(invalidEvent)).toThrow();
    });

    it('should maintain max events limit', () => {
      // Mock the maxEvents to 5 for testing
      (auditor as unknown as SecurityAuditorWithPrivate).maxEvents = 5;

      for (let i = 0; i < 7; i++) {
        auditor.logEvent({
          type: SecurityEventType.AUTH_SUCCESS,
          resource: `api/${i}`,
          action: 'test',
          success: true,
        });
      }

      const events = auditor.filterEvents();
      expect(events).toHaveLength(5);
    });

    it('should log to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      auditor.logEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        resource: 'api/login',
        action: 'login',
        success: true,
      });

      expect(console.warn).toHaveBeenCalledWith('[SECURITY] auth_success: api/login - login (SUCCESS)');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log to console in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      auditor.logEvent({
        type: SecurityEventType.AUTH_FAILURE,
        resource: 'api/login',
        action: 'login',
        success: false,
      });

      expect(console.warn).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getEvents', () => {
    beforeEach(() => {
      // Add some test events
      auditor.logEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user1',
        resource: 'api/login',
        action: 'login',
        success: true,
      });

      auditor.logEvent({
        type: SecurityEventType.AUTH_FAILURE,
        userId: 'user2',
        resource: 'api/login',
        action: 'login',
        success: false,
      });

      auditor.logEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        ipAddress: '127.0.0.1',
        resource: 'api/test',
        action: 'test',
        success: false,
      });
    });

    it('should return all events without filter', () => {
      const events = auditor.filterEvents();
      expect(events).toHaveLength(3);
    });

    it('should filter by type', () => {
      const events = auditor.filterEvents({ type: SecurityEventType.AUTH_SUCCESS });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.AUTH_SUCCESS);
    });

    it('should filter by userId', () => {
      const events = auditor.filterEvents({ userId: 'user1' });
      expect(events).toHaveLength(1);
      expect(events[0].userId).toBe('user1');
    });

    it('should filter by since date', () => {
      const since = new Date(Date.now() - 1000);
      const events = auditor.filterEvents({ since });
      expect(events).toHaveLength(3);
    });

    it('should limit results', () => {
      const events = auditor.filterEvents({ limit: 2 });
      expect(events).toHaveLength(2);
    });

    it('should combine filters', () => {
      const events = auditor.filterEvents({
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user1',
        limit: 10,
      });
      expect(events).toHaveLength(1);
    });
  });

  describe('getSecuritySummary', () => {
    beforeEach(() => {
      // Add test events
      for (let i = 0; i < 5; i++) {
        auditor.logEvent({
          type: SecurityEventType.AUTH_SUCCESS,
          resource: 'api/login',
          action: 'login',
          success: true,
        });
      }

      for (let i = 0; i < 3; i++) {
        auditor.logEvent({
          type: SecurityEventType.AUTH_FAILURE,
          resource: 'api/login',
          action: 'login',
          success: false,
        });
      }

      for (let i = 0; i < 2; i++) {
        auditor.logEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          resource: 'api/test',
          action: 'test',
          success: false,
        });
      }
    });

    it('should return correct summary', () => {
      const summary = auditor.getSecuritySummary();

      expect(summary.totalEvents).toBe(10);
      expect(summary.authSuccessCount).toBe(5);
      expect(summary.authFailureCount).toBe(3);
      expect(summary.rateLimitCount).toBe(2);
      expect(summary.recentEvents).toHaveLength(10);
    });

    it('should return recent events limited to 100', () => {
      // Add more events to exceed 100
      for (let i = 0; i < 105; i++) {
        auditor.logEvent({
          type: SecurityEventType.INVALID_REQUEST,
          resource: 'api/test',
          action: 'test',
          success: false,
        });
      }

      const summary = auditor.getSecuritySummary();
      expect(summary.recentEvents).toHaveLength(100);
      expect(summary.totalEvents).toBe(115);
    });
  });

  describe('generateEventId', () => {
    it('should generate unique ids', () => {
      const id1 = (auditor as unknown as SecurityAuditorWithPrivate).generateEventId();
      const id2 = (auditor as unknown as SecurityAuditorWithPrivate).generateEventId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^sec_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^sec_\d+_[a-z0-9]+$/);
    });
  });
});
