import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../utils/logger';
import {
  MCPMessage,
  MCPCommand,
  MCPResponse,
  MCPTool,
  MCPConnection,
  MCPError,
} from '../protocol/types';

export interface MCPClientOptions {
  serverUrl: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class MCPClient {
  private readonly logger = createLogger();
  private connection: MCPConnection | null = null;
  private messageHandlers: Map<string, (response: MCPResponse) => void> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(private readonly options: MCPClientOptions) {}

  async connect(): Promise<void> {
    this.logger.info({ url: this.options.serverUrl }, 'Connecting to MCP server');
    // TODO: Implement actual connection logic (WebSocket, etc.)
    
    // Simulate connection for now
    this.connection = {
      send: async (message: MCPMessage) => {
        this.logger.debug({ message }, 'Sending message');
        // TODO: Implement actual message sending
      },
      onMessage: (callback: (message: MCPMessage) => void) => {
        // TODO: Implement actual message receiving
        return () => {};
      },
      close: async () => {
        this.logger.info('Closing connection');
        // TODO: Implement actual connection closing
      }
    };
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async registerTool(tool: MCPTool): Promise<void> {
    const message: MCPMessage = {
      type: 'register',
      id: uuidv4(),
      timestamp: Date.now(),
      payload: tool
    };

    await this.sendAndWaitForResponse(message);
  }

  async unregisterTool(toolName: string): Promise<void> {
    const message: MCPMessage = {
      type: 'unregister',
      id: uuidv4(),
      timestamp: Date.now(),
      payload: { toolName }
    };

    await this.sendAndWaitForResponse(message);
  }

  async executeCommand<T>(
    tool: string,
    method: string,
    params: Record<string, unknown>
  ): Promise<T> {
    const command: MCPCommand = {
      type: 'command',
      id: uuidv4(),
      timestamp: Date.now(),
      tool,
      method,
      params,
      payload: params
    };

    const response = await this.sendAndWaitForResponse(command);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Command execution failed');
    }

    return response.data as T;
  }

  private async sendAndWaitForResponse(message: MCPMessage): Promise<MCPResponse> {
    if (!this.connection) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(message.id);
        reject(new Error('Command timeout'));
      }, 30000); // 30 second timeout

      this.messageHandlers.set(message.id, (response: MCPResponse) => {
        clearTimeout(timeout);
        this.messageHandlers.delete(message.id);
        resolve(response);
      });

      this.connection!.send(message).catch(error => {
        clearTimeout(timeout);
        this.messageHandlers.delete(message.id);
        reject(error);
      });
    });
  }

  private handleMessage(message: MCPMessage): void {
    if (message.type === 'response' && 'commandId' in message && 'success' in message) {
      const response = message as MCPResponse;
      const handler = this.messageHandlers.get(response.commandId);
      if (handler) {
        handler(response);
      }
    }
  }

  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts < (this.options.maxReconnectAttempts || 5)) {
      this.reconnectAttempts++;
      this.logger.info(
        { attempt: this.reconnectAttempts },
        'Attempting to reconnect'
      );

      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connect();
          this.reconnectAttempts = 0;
        } catch (error) {
          this.logger.error({ error }, 'Reconnection failed');
          await this.handleDisconnect();
        }
      }, this.options.reconnectInterval || 5000);
    } else {
      this.logger.error('Max reconnection attempts reached');
      throw new Error('Max reconnection attempts reached');
    }
  }
} 