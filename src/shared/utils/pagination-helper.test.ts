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
import { jest } from '@jest/globals';

import { PaginationHelper } from './pagination-helper.js';

describe('PaginationHelper', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('normalizeParams', () => {
    it('should return defaults for empty params', () => {
      const result = PaginationHelper.normalizeParams({});
      expect(result).toEqual({
        limit: 50,
        offset: 0,
        page: 1,
      });
    });

    it('should normalize limit within bounds', () => {
      expect(PaginationHelper.normalizeParams({ limit: 0 })).toEqual({
        limit: 1,
        offset: 0,
        page: 1,
      });
      expect(PaginationHelper.normalizeParams({ limit: 2000 })).toEqual({
        limit: 1000,
        offset: 0,
        page: 1,
      });
    });

    it('should convert page to offset', () => {
      const result = PaginationHelper.normalizeParams({ page: 3, limit: 10 });
      expect(result).toEqual({
        limit: 10,
        offset: 20,
        page: 3,
      });
    });

    it('should ensure non-negative offset', () => {
      const result = PaginationHelper.normalizeParams({ offset: -5 });
      expect(result).toEqual({
        limit: 50,
        offset: 0,
        page: 1,
      });
    });

    it('should calculate page from offset', () => {
      const result = PaginationHelper.normalizeParams({ offset: 75, limit: 25 });
      expect(result).toEqual({
        limit: 25,
        offset: 75,
        page: 4,
      });
    });
  });

  describe('createMeta', () => {
    it('should create pagination meta', () => {
      const result = PaginationHelper.createMeta(150, { limit: 20, offset: 40, page: 3 });
      expect(result).toEqual({
        total: 150,
        limit: 20,
        offset: 40,
        currentPage: 3,
        totalPages: 8,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should handle first page', () => {
      const result = PaginationHelper.createMeta(100, { limit: 10, offset: 0, page: 1 });
      expect(result.hasPrev).toBe(false);
      expect(result.hasNext).toBe(true);
    });

    it('should handle last page', () => {
      const result = PaginationHelper.createMeta(100, { limit: 10, offset: 90, page: 10 });
      expect(result.hasPrev).toBe(true);
      expect(result.hasNext).toBe(false);
    });
  });

  describe('paginateArray', () => {
    const items = Array.from({ length: 100 }, (_, i) => `item-${i + 1}`);

    it('should paginate array with defaults', () => {
      const result = PaginationHelper.paginateArray(items);
      expect(result.items).toHaveLength(50);
      expect(result.items[0]).toBe('item-1');
      expect(result.items[49]).toBe('item-50');
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should paginate with custom params', () => {
      const result = PaginationHelper.paginateArray(items, { limit: 10, offset: 20 });
      expect(result.items).toHaveLength(10);
      expect(result.items[0]).toBe('item-21');
      expect(result.items[9]).toBe('item-30');
      expect(result.pagination.currentPage).toBe(3);
    });

    it('should handle offset beyond array length', () => {
      const result = PaginationHelper.paginateArray(items, { limit: 10, offset: 95 });
      expect(result.items).toHaveLength(5);
      expect(result.items[0]).toBe('item-96');
      expect(result.items[4]).toBe('item-100');
    });
  });

  describe('generateLinks', () => {
    const baseUrl = '/api/entities';
    const pagination: Parameters<typeof PaginationHelper.generateLinks>[1] = {
      total: 100,
      limit: 10,
      offset: 20,
      currentPage: 3,
      totalPages: 10,
      hasNext: true,
      hasPrev: true,
    };

    it('should generate all links', () => {
      const result = PaginationHelper.generateLinks(baseUrl, pagination);
      expect(result.self).toBe('/api/entities?limit=10&offset=20');
      expect(result.first).toBe('/api/entities?limit=10&offset=0');
      expect(result.last).toBe('/api/entities?limit=10&offset=90');
      expect(result.prev).toBe('/api/entities?limit=10&offset=10');
      expect(result.next).toBe('/api/entities?limit=10&offset=30');
    });

    it('should include query params', () => {
      const result = PaginationHelper.generateLinks(baseUrl, pagination, { filter: 'active' });
      expect(result.self).toBe('/api/entities?filter=active&limit=10&offset=20');
    });

    it('should skip prev on first page', () => {
      const firstPagePagination = { ...pagination, hasPrev: false, currentPage: 1 };
      const result = PaginationHelper.generateLinks(baseUrl, firstPagePagination);
      expect(result.prev).toBeUndefined();
      expect(result.next).toBeDefined();
    });

    it('should skip next on last page', () => {
      const lastPagePagination = { ...pagination, hasNext: false, currentPage: 10 };
      const result = PaginationHelper.generateLinks(baseUrl, lastPagePagination);
      expect(result.next).toBeUndefined();
      expect(result.prev).toBeDefined();
    });
  });

  describe('validateParams', () => {
    it('should validate valid params', () => {
      const result = PaginationHelper.validateParams({ limit: 10, offset: 20, page: 3 });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate limit errors', () => {
      expect(PaginationHelper.validateParams({ limit: 0 }).errors).toContain('limit must be a positive integer');
      expect(PaginationHelper.validateParams({ limit: 1.5 }).errors).toContain('limit must be a positive integer');
      expect(PaginationHelper.validateParams({ limit: 2000 }).errors).toContain('limit cannot exceed 1000');
    });

    it('should validate offset errors', () => {
      expect(PaginationHelper.validateParams({ offset: -1 }).errors).toContain('offset must be a non-negative integer');
      expect(PaginationHelper.validateParams({ offset: 1.5 }).errors).toContain(
        'offset must be a non-negative integer'
      );
    });

    it('should validate page errors', () => {
      expect(PaginationHelper.validateParams({ page: 0 }).errors).toContain('page must be a positive integer');
      expect(PaginationHelper.validateParams({ page: -1 }).errors).toContain('page must be a positive integer');
    });

    it('should return multiple errors', () => {
      const result = PaginationHelper.validateParams({ limit: 0, offset: -1, page: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('shouldPaginate', () => {
    it('should return true for large datasets', () => {
      expect(PaginationHelper.shouldPaginate(2000)).toBe(true);
      expect(PaginationHelper.shouldPaginate(1100, 1024)).toBe(true);
    });

    it('should return false for small datasets', () => {
      expect(PaginationHelper.shouldPaginate(100)).toBe(false);
      expect(PaginationHelper.shouldPaginate(500, 2048)).toBe(false);
    });
  });
});
