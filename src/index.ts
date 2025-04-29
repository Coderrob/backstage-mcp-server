import { startServer } from './server';

(async function () {
  await startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
})();
