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
 * Cache entry structure to store cached data along with metadata
 * @template T - Type of the cached data
 */
export interface ICacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
}

/**
 * Configuration for the caching mechanism
 * - defaultTtl: Default time to live for cache entries in milliseconds
 * - maxSize: Maximum number of entries in the cache
 * - cleanupInterval: Interval for periodic cleanup of expired entries in milliseconds
 */
export interface ICacheConfig {
  defaultTtl: number;
  maxSize: number;
  cleanupInterval: number;
}
