import { MCPServer } from './server/MCPServer';
import { WebSocketTransport } from './transport/WebSocketTransport';
import { JiraTool } from './tools/JiraTool';
import { ConfluenceTool } from './tools/ConfluenceTool';
import { JiraClient } from '../clients/JiraClient';
import { ConfluenceClient } from '../clients/ConfluenceClient';
import { MCPClientOptions } from '../types';
import { createLogger } from '../utils/logger';

export interface MCPOptions {
  port?: number;
  host?: string;
  jira?: {
    baseUrl: string;
    apiToken: string;
  };
  confluence?: {
    baseUrl: string;
    apiToken: string;
  };
}

export class MCP {
  private readonly logger = createLogger();
  private server: MCPServer;
  private transport: WebSocketTransport;
  private jiraTool?: JiraTool;
  private confluenceTool?: ConfluenceTool;

  constructor(private readonly options: MCPOptions) {
    const port = options.port || 8080;
    this.transport = new WebSocketTransport({
      port,
      host: options.host || 'localhost',
    });

    this.server = new MCPServer(port);

    if (options.jira) {
      const jiraClient = new JiraClient({
        baseUrl: options.jira.baseUrl,
        apiToken: options.jira.apiToken,
      });
      this.jiraTool = new JiraTool(jiraClient);
    }

    if (options.confluence) {
      const confluenceClient = new ConfluenceClient({
        baseUrl: options.confluence.baseUrl,
        apiToken: options.confluence.apiToken,
      });
      this.confluenceTool = new ConfluenceTool(confluenceClient);
    }
  }

  async start(): Promise<void> {
    await this.transport.startServer();
    
    if (this.jiraTool) {
      this.server.registerTool(this.jiraTool.getTool());
    }
    
    if (this.confluenceTool) {
      this.server.registerTool(this.confluenceTool.getTool());
    }

    this.logger.info('MCP server started');
  }

  async stop(): Promise<void> {
    if (this.jiraTool) {
      this.server.unregisterTool(this.jiraTool.getTool().name);
    }
    
    if (this.confluenceTool) {
      this.server.unregisterTool(this.confluenceTool.getTool().name);
    }

    await this.transport.stopServer();
    this.logger.info('MCP server stopped');
  }
} 