import * as winston from 'winston';
import { getRequestId, getRequestUserId } from './request-context';

const isProduction = process.env.NODE_ENV === 'production';

const injectRequestContext = winston.format((info) => {
  const requestId = getRequestId();
  const userId = getRequestUserId();
  if (requestId) {
    info.requestId = requestId;
  }
  if (userId) {
    info.userId = userId;
  }
  return info;
});

const consoleFormat = winston.format.printf(({ timestamp, level, message, context, requestId, userId, stack, ...meta }) => {
  const parts = [
    String(timestamp),
    level.toUpperCase().padEnd(5),
    `[${requestId ?? '-'}]`,
    context ? `[${context}]` : undefined,
    userId ? `(user:${userId})` : undefined,
    typeof message === 'string' ? message : JSON.stringify(message),
  ].filter(Boolean);

  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

  return `${parts.join(' ')}${metaStr}${stack ? `\n${stack}` : ''}`;
});

const baseFormat = winston.format.combine(
  injectRequestContext(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
);

export const winstonLoggerOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(baseFormat, winston.format.json())
        : winston.format.combine(baseFormat, winston.format.colorize({ level: true }), consoleFormat),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(baseFormat, winston.format.json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(baseFormat, winston.format.json()),
    }),
  ],
  exitOnError: false,
};
