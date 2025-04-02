# Troubleshooting Guide

This guide provides solutions for common issues you might encounter while using the Atlassian MCP SDK.

## Authentication Issues

### Invalid API Token
**Error**: `MCPAuthenticationError: Invalid API token`
**Solution**: 
1. Verify that your API token is correct
2. Ensure you're using a valid Atlassian API token (not your password)
3. Check if the token has the necessary permissions for the operations you're trying to perform

### Token Expired
**Error**: `MCPAuthenticationError: Token has expired`
**Solution**:
1. Generate a new API token from your Atlassian account settings
2. Update your client configuration with the new token

## Network Issues

### Connection Timeout
**Error**: `MCPRequestError: Request timeout`
**Solution**:
1. Check your internet connection
2. Increase the timeout value in your client configuration:
```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  timeout: 60000, // Increase timeout to 60 seconds
});
```

### Rate Limiting
**Error**: `MCPRequestError: Rate limit exceeded`
**Solution**:
1. Implement rate limiting in your application
2. Use the retry mechanism with appropriate delays:
```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  retryConfig: {
    maxRetries: 5,
    retryDelay: 2000,
    retryableStatusCodes: [429],
  },
});
```

## Data Validation Issues

### Invalid JQL Query
**Error**: `MCPValidationError: Invalid JQL query`
**Solution**:
1. Check the JQL syntax in your query
2. Verify that the fields and operators you're using are valid
3. Ensure all field names are correct

### Invalid Page Content
**Error**: `MCPValidationError: Invalid page content`
**Solution**:
1. Ensure the page content follows Confluence's storage format
2. Check for valid HTML in the content
3. Verify that all required fields are provided

## TypeScript Type Issues

### Missing Type Definitions
**Error**: `Type 'X' is not assignable to type 'Y'`
**Solution**:
1. Ensure you're using the correct types from the SDK
2. Import the necessary types:
```typescript
import { JiraIssue, ConfluencePage } from '@aljazeera/atlassian-mcp';
```

### Incorrect Field Types
**Error**: `Property 'X' does not exist on type 'Y'`
**Solution**:
1. Check the API documentation for the correct field names
2. Use the provided TypeScript interfaces as reference
3. Ensure you're using the latest version of the SDK

## Logging Issues

### No Logs Appearing
**Solution**:
1. Check the log level configuration:
```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  logger: {
    level: 'debug', // Set to appropriate level: 'silent' | 'error' | 'warn' | 'info' | 'debug'
  },
});
```

### Too Many Logs
**Solution**:
1. Adjust the log level to a higher severity:
```typescript
const client = new JiraClient({
  baseUrl: 'https://your-domain.atlassian.net',
  apiToken: 'your-api-token',
  logger: {
    level: 'warn', // Only show warnings and errors
  },
});
```

## Performance Issues

### Slow Response Times
**Solution**:
1. Use pagination for large result sets
2. Limit the fields being requested
3. Use appropriate expand parameters

Example:
```typescript
// Instead of requesting all fields
const result = await client.searchIssues({
  jql: 'project = PROJ',
  fields: ['summary', 'description'], // Only request needed fields
  maxResults: 50, // Use pagination
});
```

### Memory Usage
**Solution**:
1. Process results in batches
2. Use pagination to limit the amount of data in memory
3. Clean up resources when done

## Common Workarounds

### Handling Large Result Sets
```typescript
async function getAllIssues(client: JiraClient, jql: string) {
  let startAt = 0;
  const maxResults = 100;
  const allIssues = [];

  while (true) {
    const result = await client.searchIssues({
      jql,
      startAt,
      maxResults,
    });

    allIssues.push(...result.data.issues);

    if (result.data.issues.length < maxResults) {
      break;
    }

    startAt += maxResults;
  }

  return allIssues;
}
```

### Retrying Failed Operations
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}
```

## Bun-specific Issues

### Installation Problems
**Error**: `bun install` fails
**Solution**:
1. Ensure you have the latest version of Bun installed:
```bash
bun --version
```
2. Clear Bun's cache if needed:
```bash
bun pm cache rm
```
3. Try installing with verbose logging:
```bash
bun install --verbose
```

### Test Runner Issues
**Error**: `bun test` fails
**Solution**:
1. Check if your test files are in the correct location
2. Ensure your test files have the correct extension (`.test.ts` or `.spec.ts`)
3. Try running with the `--timeout` flag if tests are timing out:
```bash
bun test --timeout 10000
```

### Build Issues
**Error**: `bun run build` fails
**Solution**:
1. Check if all dependencies are installed correctly
2. Try cleaning the build directory:
```bash
rm -rf dist
bun run build
```
3. Run with verbose logging:
```bash
bun run build --verbose
```

### Performance Issues
**Solution**:
1. Use Bun's built-in performance monitoring:
```bash
bun --profile run build
```
2. Enable debug logging:
```bash
DEBUG=* bun run build
```

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/aljazeera/atlassian-mcp/issues) for similar problems
2. Create a new issue with:
   - Detailed error message
   - Steps to reproduce
   - Code example
   - Environment details
3. Join our community discussions 