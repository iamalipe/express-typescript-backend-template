import { SpanStatusCode, trace } from '@opentelemetry/api';
import { Request, Response } from 'express';

const tracer = trace.getTracer(
  'express-typescript-backend-template-controller',
  process.env.NODE_ENV === 'development' ? '1.0.0-dev' : '1.0.0',
);

export const rootController = async (req: Request, res: Response) => {
  const span = tracer.startSpan('rootController');
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
  res.send('Hello World');
};
export const healthCheckController = async (req: Request, res: Response) => {
  const span = tracer.startSpan('healthCheckController');
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
  res.sendStatus(200);
};
