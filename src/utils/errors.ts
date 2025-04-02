export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPRequestError extends MCPError {
  constructor(
    code: string,
    message: string,
    public status?: number,
    details?: unknown,
  ) {
    super(code, message, details);
    this.name = 'MCPRequestError';
  }
}

export class MCPAuthenticationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super('AUTH_ERROR', message, details);
    this.name = 'MCPAuthenticationError';
  }
}

export class MCPValidationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'MCPValidationError';
  }
} 