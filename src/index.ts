import { startServer } from './server.js';
import { logger } from './utils/core/logger.js';
import { isError } from './utils/index.js';

(async function main(): Promise<void> {
  await startServer().catch((err) => {
    logger.error('Fatal server startup error', {
      error: isError(err) ? err.message : String(err),
    });
    process.exit(1);
  });
})();
