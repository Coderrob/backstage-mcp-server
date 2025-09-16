import { isNumber } from '../core/guards.js';

/* eslint-disable import/no-unused-modules */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number; // Alternative to offset
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export class PaginationHelper {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 1000;

  /**
   * Normalize pagination parameters
   */
  static normalizeParams(params: PaginationParams = {}): Required<PaginationParams> {
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
  static createMeta(totalItems: number, params: Required<PaginationParams>): PaginationMeta {
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
  static paginateArray<T>(items: T[], params: PaginationParams = {}): PaginatedResponse<T> {
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
    pagination: PaginationMeta,
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
  static validateParams(params: PaginationParams): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (params.limit !== undefined) {
      if (!Number.isInteger(params.limit) || params.limit < 1) {
        errors.push('limit must be a positive integer');
      } else if (params.limit > this.MAX_LIMIT) {
        errors.push(`limit cannot exceed ${this.MAX_LIMIT}`);
      }
    }

    if (params.offset !== undefined) {
      if (!Number.isInteger(params.offset) || params.offset < 0) {
        errors.push('offset must be a non-negative integer');
      }
    }

    if (params.page !== undefined) {
      if (!Number.isInteger(params.page) || params.page < 1) {
        errors.push('page must be a positive integer');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
