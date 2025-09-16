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
