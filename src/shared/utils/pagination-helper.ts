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
import { IPaginatedResponse, IPaginationMeta, IPaginationParams } from '../../shared/types/paging.js';
import { isNumber } from '../../shared/utils/guards.js';
import { validatePaginationParams } from '../../shared/utils/validation.js';

export class PaginationHelper {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 1000;

  /**
   * Normalize pagination parameters
   */
  static normalizeParams(params: IPaginationParams = {}): Required<IPaginationParams> {
    let { limit = this.DEFAULT_LIMIT, offset = 0 } = params;
    const { page } = params;

    // Validate and clamp limit
    limit = Math.max(1, Math.min(limit, this.MAX_LIMIT));

    // Convert page to offset if provided
    if (page !== undefined && page > 0) {
      offset = (page - 1) * limit;
    }

    // Ensure offset is non-negative
    offset = Math.max(0, offset);

    return {
      limit,
      offset,
      page: isNumber(page) && !Number.isNaN(page) && page > 0 ? page : Math.floor(offset / limit) + 1,
    };
  }

  /**
   * Create pagination metadata
   */
  static createMeta(totalItems: number, params: Required<IPaginationParams>): IPaginationMeta {
    const { limit, offset } = params;
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      total: totalItems,
      limit,
      offset,
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    };
  }

  /**
   * Apply pagination to an array
   */
  static paginateArray<T>(items: T[], params: IPaginationParams = {}): IPaginatedResponse<T> {
    const normalizedParams = this.normalizeParams(params);
    const { limit, offset } = normalizedParams;

    const paginatedItems = items.slice(offset, offset + limit);
    const pagination = this.createMeta(items.length, normalizedParams);

    return {
      items: paginatedItems,
      pagination,
    };
  }

  /**
   * Generate pagination links for API responses
   */
  static generateLinks(
    baseUrl: string,
    pagination: IPaginationMeta,
    queryParams: Record<string, string> = {}
  ): Record<string, string> {
    const links: Record<string, string> = {};

    // Helper to build URL with params
    const buildUrl = (params: Record<string, string | number>): string => {
      const url = new URL(baseUrl, 'http://localhost'); // Base URL for URL construction
      Object.entries({ ...queryParams, ...params }).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
      return url.pathname + url.search;
    };

    // Self link
    links.self = buildUrl({
      limit: pagination.limit,
      offset: pagination.offset,
    });

    // First page
    links.first = buildUrl({
      limit: pagination.limit,
      offset: 0,
    });

    // Last page
    links.last = buildUrl({
      limit: pagination.limit,
      offset: (pagination.totalPages - 1) * pagination.limit,
    });

    // Previous page
    if (pagination.hasPrev) {
      links.prev = buildUrl({
        limit: pagination.limit,
        offset: (pagination.currentPage - 2) * pagination.limit,
      });
    }

    // Next page
    if (pagination.hasNext) {
      links.next = buildUrl({
        limit: pagination.limit,
        offset: pagination.currentPage * pagination.limit,
      });
    }

    return links;
  }

  /**
   * Validate pagination parameters
   */
  static validateParams(params: IPaginationParams): {
    valid: boolean;
    errors: string[];
  } {
    return validatePaginationParams(params);
  }

  /**
   * Estimate if pagination is needed
   */
  static shouldPaginate(totalItems: number, estimatedItemSize: number = 1024): boolean {
    // Estimate response size (rough heuristic)
    const estimatedResponseSize = totalItems * estimatedItemSize;

    // Paginate if response would be larger than 1MB
    return estimatedResponseSize > 1024 * 1024;
  }
}
