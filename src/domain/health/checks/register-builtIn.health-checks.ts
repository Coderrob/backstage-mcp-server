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

import { logger } from '../../../shared/utils/logger.js';
import { healthChecker } from '../health-checker.js';
import { apiConnectivityHealthCheck } from './api-connectivity.health-check.js';
import { databaseHealthCheck } from './database.health-check.js';
import { memoryHealthCheck } from './memory.health-check.js';
import { toolRegistryHealthCheck } from './tool-registry.health-check.js';

/**
 * Registers all built-in health checks
 */

export function registerBuiltInHealthChecks(): void {
  healthChecker.registerCheck('database', databaseHealthCheck);
  healthChecker.registerCheck('api-connectivity', apiConnectivityHealthCheck);
  healthChecker.registerCheck('memory', memoryHealthCheck);
  healthChecker.registerCheck('tool-registry', toolRegistryHealthCheck);

  logger.info('Built-in health checks registered');
}
