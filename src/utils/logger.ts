import pino from 'pino';
import { MCPConfig } from '../types';

export const createLogger = (config?: MCPConfig['logger']): pino.Logger => {
  const options: pino.LoggerOptions = {
    level: config?.level || 'info',
    transport: config?.pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  };

  return pino(options);
}; 