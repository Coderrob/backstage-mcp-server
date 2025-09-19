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
export interface JsonApiResource {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, JsonApiRelationship>;
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface JsonApiRelationship {
  data?: JsonApiResourceIdentifier | JsonApiResourceIdentifier[];
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface JsonApiResourceIdentifier {
  id: string;
  type: string;
  meta?: Record<string, unknown>;
}

export interface JsonApiDocument {
  data?: JsonApiResource | JsonApiResource[];
  errors?: JsonApiError[];
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
  included?: JsonApiResource[];
  jsonapi?: {
    version: string;
    meta?: Record<string, unknown>;
  };
}

export interface JsonApiError {
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
