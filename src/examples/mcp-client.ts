import { MCPClient } from '../mcp/client/MCPClient';
import { createLogger } from '../utils/logger';

const logger = createLogger();

async function main() {
  try {
    // Create MCP client
    const client = new MCPClient({
      serverUrl: 'ws://localhost:8080',
    });

    // Connect to the server
    await client.connect();
    logger.info('Connected to MCP server');

    // Example: Create a Jira issue
    const createIssueResponse = await client.executeCommand('jira', 'createIssue', {
      project: 'PROJ',
      summary: 'Test Issue',
      description: 'This is a test issue created via MCP',
      issuetype: 'Task',
      priority: 'Medium',
      labels: ['mcp', 'test'],
    });
    logger.info({ response: createIssueResponse }, 'Created Jira issue');

    // Example: Create a Confluence page
    const createPageResponse = await client.executeCommand('confluence', 'createPage', {
      type: 'page',
      title: 'Test Page',
      space: 'TEST',
      body: {
        storage: {
          value: '<p>This is a test page created via MCP</p>',
          representation: 'storage',
        },
      },
    });
    logger.info({ response: createPageResponse }, 'Created Confluence page');

    // Example: Search for Jira issues
    const searchResponse = await client.executeCommand('jira', 'searchIssues', {
      jql: 'project = PROJ',
      startAt: 0,
      maxResults: 10,
      fields: ['summary', 'description', 'status'],
    });
    logger.info({ response: searchResponse }, 'Searched for Jira issues');

    // Example: Search for Confluence pages
    const searchPagesResponse = await client.executeCommand('confluence', 'searchPages', {
      cql: 'type=page AND space=TEST',
      start: 0,
      limit: 10,
      expand: ['version', 'space'],
    });
    logger.info({ response: searchPagesResponse }, 'Searched for Confluence pages');

    // Disconnect from the server
    await client.disconnect();
    logger.info('Disconnected from MCP server');
  } catch (error) {
    logger.error({ error }, 'Failed to interact with MCP server');
    process.exit(1);
  }
}

main(); 