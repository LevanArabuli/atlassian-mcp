export interface MCPConfig {
  baseUrl: string;
  apiToken: string;
  timeout?: number;
  logger?: {
    level?: string;
    pretty?: boolean;
  };
}

export interface MCPResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface MCPError {
  code: string;
  message: string;
  details?: unknown;
}

export interface MCPRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  validateStatus?: (status: number) => boolean;
  params?: Record<string, unknown>;
}

export interface MCPClientOptions extends MCPConfig {
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    retryableStatusCodes: number[];
  };
} 