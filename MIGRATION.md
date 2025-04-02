# Migration Guide

This guide helps you migrate between different versions of the Atlassian MCP SDK.

## Migrating to 1.0.0

### Breaking Changes

#### Client Configuration
The client configuration structure has been updated to be more consistent:

```typescript
// Before
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  retry: {
    attempts: 3,
    delay: 1000,
  },
  logging: {
    level: 'info',
  },
});

// After
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatusCodes: [429, 500, 502, 503, 504],
  },
  logger: {
    level: 'info',
  },
});
```

#### Error Handling
Error classes have been renamed and restructured:

```typescript
// Before
import { RequestError, AuthError } from '@aljazeera/atlassian-mcp';

// After
import { MCPRequestError, MCPAuthenticationError } from '@aljazeera/atlassian-mcp';
```

#### Response Types
Response types now include a standardized structure:

```typescript
// Before
const issue = await client.getIssue('PROJ-123');

// After
const { data: issue } = await client.getIssue('PROJ-123');
```

### New Features

#### Type Safety
The SDK now provides better TypeScript support:

```typescript
// New type-safe methods
interface IssueUpdate {
  fields: {
    summary?: string;
    description?: string;
    priority?: 'High' | 'Medium' | 'Low';
  };
}

await client.updateIssue('PROJ-123', {
  fields: {
    summary: 'New Summary',
    priority: 'High', // TypeScript will validate this
  },
});
```

#### Improved Logging
Enhanced logging capabilities:

```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  logger: {
    level: 'debug',
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

### Deprecated Features

#### Legacy Methods
Some methods have been deprecated in favor of new ones:

```typescript
// Deprecated
await client.searchIssuesByProject('PROJ');

// Use instead
await client.searchIssues({
  jql: 'project = PROJ',
});
```

### Migration Steps

1. Update your package.json:
```json
{
  "dependencies": {
    "@aljazeera/atlassian-mcp": "^1.0.0"
  }
}
```

2. Update your imports:
```typescript
// Before
import { JiraClient, RequestError } from '@aljazeera/atlassian-mcp';

// After
import { JiraClient, MCPRequestError } from '@aljazeera/atlassian-mcp';
```

3. Update client initialization:
```typescript
// Before
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  retry: {
    attempts: 3,
    delay: 1000,
  },
});

// After
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatusCodes: [429, 500, 502, 503, 504],
  },
});
```

4. Update error handling:
```typescript
// Before
try {
  await client.getIssue('PROJ-123');
} catch (error) {
  if (error instanceof RequestError) {
    console.error('Request failed:', error.message);
  }
}

// After
try {
  await client.getIssue('PROJ-123');
} catch (error) {
  if (error instanceof MCPRequestError) {
    console.error('Request failed:', error.message);
  }
}
```

5. Update response handling:
```typescript
// Before
const issue = await client.getIssue('PROJ-123');
console.log(issue.fields.summary);

// After
const { data: issue } = await client.getIssue('PROJ-123');
console.log(issue.fields.summary);
```

### Testing Your Migration

1. Run your test suite:
```bash
bun test
```

2. Check for deprecation warnings:
```bash
bun run lint
```

3. Test in a staging environment:
```typescript
// Create a test client
const testClient = new JiraClient({
  baseUrl: process.env.TEST_ATLASSIAN_BASE_URL,
  apiToken: process.env.TEST_ATLASSIAN_API_TOKEN,
});

// Test basic operations
async function testMigration() {
  try {
    // Test search
    const { data: searchResult } = await testClient.searchIssues({
      jql: 'project = TEST',
      maxResults: 1,
    });

    // Test get issue
    const { data: issue } = await testClient.getIssue('TEST-1');

    // Test update
    await testClient.updateIssue('TEST-1', {
      fields: {
        summary: 'Test Update',
      },
    });

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

### Getting Help

If you encounter any issues during migration:

1. Check the [GitHub Issues](https://github.com/aljazeera/atlassian-mcp/issues)
2. Review the [API Documentation](../README.md#api-documentation)
3. Consult the [Troubleshooting Guide](../TROUBLESHOOTING.md)
4. Create a new issue with:
   - Your current version
   - Target version
   - Error messages
   - Code examples 

## Migrating to Bun

### Overview
The project has been migrated to use Bun as the package manager and runtime. This change brings improved performance and a more modern development experience.

### Migration Steps

1. Install Bun if you haven't already:
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install dependencies with Bun:
```bash
bun install
```

3. Update your scripts in package.json:
```json
{
  "scripts": {
    "build": "bun run rollup -c",
    "dev": "bun run rollup -c -w",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "lint": "bun run eslint . --ext .ts",
    "format": "bun run prettier --write \"src/**/*.ts\"",
    "prepare": "bun run build",
    "prepublishOnly": "bun test && bun run lint"
  }
}
```

4. Update your CI/CD pipeline if you have one:
```yaml
# Example GitHub Actions workflow
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run lint
```

### Benefits of Using Bun

- Faster installation of dependencies
- Faster test execution
- Built-in TypeScript support
- Built-in test runner
- Better performance overall
- Modern package management

### Troubleshooting

If you encounter any issues during the migration:

1. Make sure you have the latest version of Bun installed
2. Clear your Bun cache if needed:
```bash
bun pm cache rm
```
3. Check the [Bun documentation](https://bun.sh/docs) for more information
4. Review the [Troubleshooting Guide](../TROUBLESHOOTING.md) 