import { buildApp } from './app';
import { pool } from './db';
import { env } from './env';

async function main() {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`);
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    app.log.info(`LifeOS API listening on http://${env.HOST}:${env.PORT} (docs at /documentation)`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
