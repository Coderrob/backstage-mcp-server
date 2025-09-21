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

/**
 * API response status enumeration indicates whether
 * the API call was successful or resulted in an error
 * @enum {string}
 */
export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Standard API response structure
 */
export interface IApiResponse {
  status: ApiStatus;
  errors?: (Error | Record<string, unknown>)[];
}

/**
 * API response structure that includes a single data item
 * @template T - Type of the data item
 */
export interface IApiDataResponse<T> extends IApiResponse {
  data: T[];
}

/**
 * Types and interfaces for JSON:API compliant data structures.
 */
export interface IApiResource {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, IApiRelationship>;
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

/**
 * Relationship object in JSON:API
 */
export interface IApiRelationship {
  data?: IApiResourceIdentifier | IApiResourceIdentifier[];
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

/**
 * Resource identifier object
 */
export interface IApiResourceIdentifier {
  id: string;
  type: string;
  meta?: Record<string, unknown>;
}

/**
 * Top-level document structure
 */
export interface IApiDocument {
  data?: IApiResource | IApiResource[];
  errors?: IApiError[];
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
  included?: IApiResource[];
  jsonapi?: {
    version: string;
  };

  version: string;
}

/**
 * Error object
 */
export interface IApiError {
  id?: string;
  links?: Record<string, string>;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
    header?: string;
  };
  meta?: Record<string, unknown>;
}

// Re-export IBackstageCatalogApi from plugins module for backward compatibility
export type { IBackstageCatalogApi } from './plugins.js';
