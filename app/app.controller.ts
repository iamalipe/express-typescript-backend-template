import { Request, Response } from 'express';

export const rootController = async (req: Request, res: Response) => {
  res.send('Hello World');
};
export const healthCheckController = async (req: Request, res: Response) => {
  res.sendStatus(200);
};

export const sseDemoController = async (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const writeAndFlush = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if ('flush' in res && typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  writeAndFlush({ status: 'connected', message: 'SSE Connection Established' });

  let count = 0;
  const intervalId = setInterval(() => {
    count++;
    const data = {
      count,
      timestamp: new Date().toISOString(),
      message: `Tick #${count} from Express server`,
    };
    writeAndFlush(data);

    if (count >= 20) {
      writeAndFlush({ status: 'done', message: 'Stream completed' });
      clearInterval(intervalId);
      res.end();
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
};

export const readableStreamDemoController = async (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson',
    'Transfer-Encoding': 'chunked',
    'X-Accel-Buffering': 'no',
  });

  const writeAndFlush = (data: object) => {
    res.write(JSON.stringify(data) + '\n');
    if ('flush' in res && typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  let count = 0;
  const intervalId = setInterval(() => {
    count++;
    const data = {
      count,
      timestamp: new Date().toISOString(),
      message: `Readable Stream chunk #${count}`,
    };
    writeAndFlush(data);

    if (count >= 20) {
      writeAndFlush({ status: 'done', message: 'Stream completed' });
      clearInterval(intervalId);
      res.end();
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
};

export const longPollDemoController = async (req: Request, res: Response) => {
  const clientCount = parseInt(req.query.count as string) || 0;

  // Simulate server-side wait for the next event (1 second delay)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const nextCount = clientCount + 1;
  const isDone = nextCount >= 20;

  res.json({
    count: nextCount,
    timestamp: new Date().toISOString(),
    message: isDone
      ? 'Long poll stream completed'
      : `Long poll response for tick #${nextCount}`,
    status: isDone ? 'done' : 'connected',
  });
};
