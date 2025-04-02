# Atlassian MCP SDK

A TypeScript SDK for interacting with Atlassian's Jira and Confluence APIs. This SDK provides a type-safe, easy-to-use interface for common operations on Jira issues and Confluence pages.

## Features

- Type-safe API interactions
- Automatic retry mechanism for failed requests
- Comprehensive error handling
- Built-in logging with Pino
- Support for both Jira and Confluence APIs
- Full TypeScript support

## Installation

```bash
bun add @aljazeera/atlassian-mcp
```

## Development

To set up the development environment:

1. Install Bun if you haven't already:
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Clone the repository and install dependencies:
```bash
git clone https://github.com/yourusername/atlassian-mcp.git
cd atlassian-mcp
bun install
```

3. Available scripts:
```bash
bun run build      # Build the project
bun run dev        # Watch mode for development
bun test          # Run tests
bun run lint      # Run ESLint
bun run format    # Format code with Prettier
```

## Quick Start

### Jira Client

```typescript
import { JiraClient } from '@aljazeera/atlassian-mcp';

const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  timeout: 30000, // optional, defaults to 30 seconds
});

// Search for issues
const searchResult = await client.searchIssues({
  jql: 'project = PROJ AND status = "In Progress"',
  fields: ['summary', 'description'],
});

// Create a new issue
const newIssue = await client.createIssue({
  fields: {
    project: { key: 'PROJ' },
    summary: 'New Issue',
    description: 'Issue description',
    issuetype: { name: 'Task' },
  },
});

// Update an issue
await client.updateIssue('PROJ-123', {
  fields: {
    summary: 'Updated Summary',
  },
});

// Delete an issue
await client.deleteIssue('PROJ-123');
```

### Confluence Client

```typescript
import { ConfluenceClient } from '@aljazeera/atlassian-mcp';

const client = new ConfluenceClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  timeout: 30000, // optional, defaults to 30 seconds
});

// Search for pages
const searchResult = await client.searchPages({
  cql: 'space = SPACE AND type = page',
  expand: ['body.storage'],
});

// Create a new page
const newPage = await client.createPage({
  type: 'page',
  title: 'New Page',
  space: { key: 'SPACE' },
  body: {
    storage: {
      value: '<p>Page content</p>',
      representation: 'storage',
    },
  },
});

// Update a page
await client.updatePage('123456', {
  version: { number: 2 },
  title: 'Updated Title',
  body: {
    storage: {
      value: '<p>Updated content</p>',
      representation: 'storage',
    },
  },
});

// Delete a page
await client.deletePage('123456');
```

## API Documentation

### JiraClient

#### Constructor Options

```typescript
interface MCPClientOptions {
  baseUrl: string;
  apiToken: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    retryableStatusCodes: number[];
  };
  logger?: {
    level: 'silent' | 'error' | 'warn' | 'info' | 'debug';
  };
}
```

#### Methods

##### searchIssues
```typescript
async searchIssues(params: {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  expand?: string[];
}): Promise<MCPResponse<JiraSearchResponse>>;
```

##### getIssue
```typescript
async getIssue(issueKey: string): Promise<MCPResponse<JiraIssue>>;
```

##### createIssue
```typescript
async createIssue(issue: Partial<JiraIssue>): Promise<MCPResponse<JiraIssue>>;
```

##### updateIssue
```typescript
async updateIssue(
  issueKey: string,
  issue: Partial<JiraIssue>,
): Promise<MCPResponse<void>>;
```

##### deleteIssue
```typescript
async deleteIssue(issueKey: string): Promise<MCPResponse<void>>;
```

### ConfluenceClient

#### Methods

##### searchPages
```typescript
async searchPages(params: {
  cql: string;
  start?: number;
  limit?: number;
  expand?: string[];
}): Promise<MCPResponse<ConfluenceSearchResponse>>;
```

##### getPage
```typescript
async getPage(pageId: string): Promise<MCPResponse<ConfluencePage>>;
```

##### createPage
```typescript
async createPage(page: ConfluenceCreatePageParams): Promise<MCPResponse<ConfluencePage>>;
```

##### updatePage
```typescript
async updatePage(
  pageId: string,
  page: ConfluenceUpdatePageParams,
): Promise<MCPResponse<ConfluencePage>>;
```

##### deletePage
```typescript
async deletePage(pageId: string): Promise<MCPResponse<void>>;
```

## Common Integration Patterns

### Batch Processing
When dealing with multiple items, use batch processing to improve performance:

```typescript
// Process issues in batches
async function processIssuesInBatches(client: JiraClient, issues: string[]) {
  const batchSize = 10;
  for (let i = 0; i < issues.length; i += batchSize) {
    const batch = issues.slice(i, i + batchSize);
    await Promise.all(
      batch.map(issueKey => client.updateIssue(issueKey, {
        fields: { status: { name: 'Done' } }
      }))
    );
  }
}
```

### Error Recovery
Implement robust error handling for production use:

```typescript
async function safeOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof MCPRequestError) {
      // Log the error with context
      console.error(`Request failed: ${error.message}`, {
        status: error.status,
        context: error.context
      });
    }
    return fallback;
  }
}
```

### Rate Limiting
Handle API rate limits gracefully:

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval: number;

  constructor(requestsPerMinute: number) {
    this.minInterval = (60 * 1000) / requestsPerMinute;
  }

  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    const operation = this.queue.shift();
    if (operation) {
      this.lastRequestTime = Date.now();
      await operation();
    }
    
    this.processing = false;
    this.processQueue();
  }
}
```

## Best Practices

### Configuration Management
Store sensitive configuration in environment variables:

```typescript
const client = new JiraClient({
  baseUrl: process.env.ATLASSIAN_BASE_URL,
  apiToken: process.env.ATLASSIAN_API_TOKEN,
  timeout: parseInt(process.env.ATLASSIAN_TIMEOUT || '30000'),
});
```

### Logging Strategy
Implement structured logging for better debugging:

```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: true,
      },
    },
  },
});
```

### Type Safety
Leverage TypeScript's type system for better code quality:

```typescript
// Define custom types for your use case
interface IssueUpdate {
  summary?: string;
  description?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

// Use type guards for runtime validation
function isValidPriority(priority: string): priority is 'High' | 'Medium' | 'Low' {
  return ['High', 'Medium', 'Low'].includes(priority);
}

// Type-safe update function
async function updateIssueSafely(
  client: JiraClient,
  issueKey: string,
  update: IssueUpdate
) {
  if (update.priority && !isValidPriority(update.priority)) {
    throw new Error('Invalid priority value');
  }
  
  return client.updateIssue(issueKey, {
    fields: update
  });
}
```

### Resource Cleanup
Implement proper cleanup for long-running operations:

```typescript
class ResourceManager {
  private resources: Set<{ dispose: () => Promise<void> }> = new Set();

  register(resource: { dispose: () => Promise<void> }) {
    this.resources.add(resource);
  }

  async dispose() {
    await Promise.all(
      Array.from(this.resources).map(resource => resource.dispose())
    );
    this.resources.clear();
  }
}

// Usage example
const manager = new ResourceManager();
try {
  const client = new JiraClient({ /* ... */ });
  manager.register(client);
  
  // Use the client
  await client.searchIssues({ /* ... */ });
} finally {
  await manager.dispose();
}
```

## Security Best Practices

### API Token Management
Never commit API tokens to version control. Use environment variables or secure secret management systems:

```typescript
// Use environment variables
const client = new JiraClient({
  baseUrl: process.env.ATLASSIAN_BASE_URL,
  apiToken: process.env.ATLASSIAN_API_TOKEN,
});

// Or use a secure secret management system
import { SecretsManager } from 'aws-sdk';
const secretsManager = new SecretsManager();

async function getClient() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'atlassian-api-token'
  }).promise();
  
  return new JiraClient({
    baseUrl: process.env.ATLASSIAN_BASE_URL,
    apiToken: secret.SecretString,
  });
}
```

### Token Rotation
Implement token rotation for long-running applications:

```typescript
class TokenRotator {
  private token: string;
  private expiryDate: Date;
  private refreshInterval: NodeJS.Timeout;

  constructor(
    private readonly refreshToken: string,
    private readonly client: JiraClient
  ) {
    this.startRotation();
  }

  private async startRotation() {
    await this.refreshToken();
    // Refresh token 1 hour before expiry
    this.refreshInterval = setInterval(
      () => this.refreshToken(),
      (this.expiryDate.getTime() - Date.now()) - 3600000
    );
  }

  private async refreshToken() {
    // Implement token refresh logic here
    // This is a placeholder for the actual implementation
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });
    
    const data = await response.json();
    this.token = data.access_token;
    this.expiryDate = new Date(Date.now() + data.expires_in * 1000);
    
    // Update client with new token
    this.client.updateToken(this.token);
  }

  dispose() {
    clearInterval(this.refreshInterval);
  }
}
```

### Request Validation
Validate all input data before making API calls:

```typescript
function validateIssueUpdate(update: Partial<JiraIssue>): void {
  if (update.fields?.summary && typeof update.fields.summary !== 'string') {
    throw new Error('Summary must be a string');
  }
  
  if (update.fields?.priority && !['High', 'Medium', 'Low'].includes(update.fields.priority)) {
    throw new Error('Invalid priority value');
  }
  
  // Add more validation as needed
}

async function updateIssueSafely(
  client: JiraClient,
  issueKey: string,
  update: Partial<JiraIssue>
) {
  validateIssueUpdate(update);
  return client.updateIssue(issueKey, update);
}
```

### Secure Logging
Avoid logging sensitive information:

```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  logger: {
    level: 'info',
    redact: ['headers.authorization', '*.apiToken', '*.password'],
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: true,
      },
    },
  },
});
```

### Error Handling
Implement secure error handling that doesn't expose sensitive information:

```typescript
class SecureErrorHandler {
  static handle(error: unknown): never {
    if (error instanceof MCPAuthenticationError) {
      // Log authentication errors without exposing credentials
      console.error('Authentication failed');
      throw new Error('Authentication failed');
    }
    
    if (error instanceof MCPRequestError) {
      // Log request errors without exposing request details
      console.error(`Request failed with status ${error.status}`);
      throw new Error('Request failed');
    }
    
    // Handle other errors
    console.error('An unexpected error occurred');
    throw new Error('An unexpected error occurred');
  }
}
```

### HTTPS
Always use HTTPS for API calls:

```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net', // Always use HTTPS
  apiToken: 'your-api-token',
  // Additional security options
  validateHttps: true, // Verify SSL certificates
  timeout: 30000, // Set reasonable timeouts
});
```

### Rate Limiting
Implement rate limiting to prevent abuse:

```typescript
class SecureRateLimiter extends RateLimiter {
  private readonly maxRequestsPerMinute: number;
  private readonly maxConcurrentRequests: number;
  private activeRequests: number = 0;

  constructor(
    maxRequestsPerMinute: number,
    maxConcurrentRequests: number
  ) {
    super(maxRequestsPerMinute);
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.maxConcurrentRequests = maxConcurrentRequests;
  }

  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrentRequests) {
      throw new Error('Too many concurrent requests');
    }

    this.activeRequests++;
    try {
      return await super.enqueue(operation);
    } finally {
      this.activeRequests--;
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 