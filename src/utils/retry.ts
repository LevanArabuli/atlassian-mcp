import { MCPRequestError } from './errors';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (!(error instanceof MCPRequestError)) {
        throw error;
      }

      if (!config.retryableStatusCodes.includes(error.status || 0)) {
        throw error;
      }

      if (attempt === config.maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, config.retryDelay * (attempt + 1)));
    }
  }

  throw lastError;
} 