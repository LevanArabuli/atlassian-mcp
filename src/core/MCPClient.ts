import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createLogger } from '../utils/logger';
import { MCPClientOptions, MCPRequestOptions, MCPResponse } from '../types';
import { MCPRequestError } from '../utils/errors';
import { withRetry, RetryConfig } from '../utils/retry';

export class MCPClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly logger = createLogger();
  private readonly retryConfig: RetryConfig;

  constructor(private readonly options: MCPClientOptions) {
    this.axiosInstance = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${options.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.retryConfig = options.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    };

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug({ url: config.url, method: config.method }, 'Making request');
        return config;
      },
      (error) => {
        this.logger.error({ error }, 'Request error');
        return Promise.reject(error);
      },
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { url: response.config.url, status: response.status },
          'Response received',
        );
        return response;
      },
      (error) => {
        this.logger.error(
          {
            url: error.config?.url,
            status: error.response?.status,
            error: error.message,
          },
          'Response error',
        );
        return Promise.reject(error);
      },
    );
  }

  protected async request<T>(
    method: string,
    url: string,
    data?: unknown,
    options: MCPRequestOptions = {},
  ): Promise<MCPResponse<T>> {
    const makeRequest = async (): Promise<MCPResponse<T>> => {
      try {
        const config: AxiosRequestConfig = {
          method,
          url,
          data,
          headers: options.headers,
          timeout: options.timeout,
          validateStatus: options.validateStatus,
          params: options.params,
        };

        const response: AxiosResponse<T> = await this.axiosInstance.request(config);

        return {
          data: response.data,
          status: response.status,
          headers: response.headers as Record<string, string>,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new MCPRequestError(
            'REQUEST_ERROR',
            error.message,
            error.response?.status,
            error.response?.data,
          );
        }
        throw error;
      }
    };

    return withRetry(makeRequest, this.retryConfig);
  }

  protected async get<T>(
    url: string,
    options?: MCPRequestOptions,
  ): Promise<MCPResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  protected async post<T>(
    url: string,
    data?: unknown,
    options?: MCPRequestOptions,
  ): Promise<MCPResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  protected async put<T>(
    url: string,
    data?: unknown,
    options?: MCPRequestOptions,
  ): Promise<MCPResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }

  protected async delete<T>(
    url: string,
    options?: MCPRequestOptions,
  ): Promise<MCPResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }
} 