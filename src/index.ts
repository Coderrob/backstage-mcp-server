import { startServer } from './server';

(async function main(): Promise<void> {
  await startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
})();
