import express from 'express';
import promClient from 'prom-client';
import {
  METRICS_SERVER_PASSWORD,
  METRICS_SERVER_PORT,
  METRICS_SERVER_USERNAME,
} from '../config/default';
import { basicAuth } from '../middlewares/basicAuth.middlewares';
import { logger } from './logger';

const app = express();

export const restResponseTimeHistogram = new promClient.Histogram({
  name: 'rest_response_time_duration_seconds',
  help: 'REST API response time in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

export const databaseResponseTimeHistogram = new promClient.Histogram({
  name: 'db_response_time_duration_seconds',
  help: 'Database response time in seconds',
  labelNames: ['operation', 'success'],
});

export function startMetricsServer() {
  const collectDefaultMetrics = promClient.collectDefaultMetrics;

  collectDefaultMetrics();

  app.get(
    '/metrics',
    basicAuth({
      username: METRICS_SERVER_USERNAME,
      password: METRICS_SERVER_PASSWORD,
    }),
    async (req, res) => {
      res.set('Content-Type', promClient.register.contentType);
      const metrics = await promClient.register.metrics();
      res.send(metrics);
    },
  );

  app.listen(METRICS_SERVER_PORT, () => {
    logger.info(
      `Metrics server started at http://localhost:${METRICS_SERVER_PORT}`,
    );
  });
}
