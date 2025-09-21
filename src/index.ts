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
import { startServer } from './application/server/server.js';
import { isError } from './shared/utils/guards.js';
import { logger } from './shared/utils/logger.js';

// Export for programmatic usage
export { startServer };

(async function main(): Promise<void> {
  await startServer().catch((err) => {
    logger.error('Fatal server startup error', {
      error: isError(err) ? err.message : String(err),
    });
    // Only exit in production, allow tests to handle errors gracefully
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    // In test mode, don't re-throw to allow tests to continue
  });
})();
