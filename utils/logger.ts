import morgan from 'morgan';
import util from 'util';
import { createLogger, format, transports } from 'winston';

// Custom printf for console (color + pretty)
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const splat = meta[Symbol.for('splat')];
    let extra = '';
    // @ts-ignore
    if (splat && splat.length > 0) {
      extra = ' ' + util.inspect(splat[0], { depth: null, colors: true });
    }

    return `[${timestamp}] ${level}: ${message}${extra}`;
  }),
);

// File format (strict JSON)
const fileFormat = format.combine(format.timestamp(), format.json());

export const logger = createLogger({
  level: 'info',
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({ filename: 'log/server.log', format: fileFormat }),
  ],
});

// Morgan stream
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan('tiny', { stream: morganStream });
