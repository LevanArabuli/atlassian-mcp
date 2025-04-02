import { MCP } from '../mcp';
import { createLogger } from '../utils/logger';

const logger = createLogger();

async function main() {
  try {
    // Create MCP instance with Jira and Confluence configurations
    const mcp = new MCP({
      port: 8080,
      host: 'localhost',
      jira: {
        baseUrl: process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net',
        apiToken: process.env.JIRA_API_TOKEN || 'your-api-token',
      },
      confluence: {
        baseUrl: process.env.CONFLUENCE_BASE_URL || 'https://your-domain.atlassian.net/wiki',
        apiToken: process.env.CONFLUENCE_API_TOKEN || 'your-api-token',
      },
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      logger.info('Shutting down MCP server...');
      await mcp.stop();
      process.exit(0);
    });

    // Start the MCP server
    await mcp.start();
    logger.info('MCP server is running on ws://localhost:8080');
  } catch (error) {
    logger.error({ error }, 'Failed to start MCP server');
    process.exit(1);
  }
}

main(); 