import WebSocket from 'ws';
import { createLogger } from '../../utils/logger';
import { MCPMessage, MCPConnection } from '../protocol/types';

export interface WebSocketTransportOptions {
  port?: number;
  host?: string;
  path?: string;
  secure?: boolean;
}

export class WebSocketTransport {
  private readonly logger = createLogger();
  private server: WebSocket.Server | null = null;
  private connections: Map<string, WebSocket> = new Map();

  constructor(private readonly options: WebSocketTransportOptions) {}

  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocket.Server({
          port: this.options.port || 8080,
          host: this.options.host || 'localhost',
          path: this.options.path || '/mcp',
        });

        this.server.on('connection', (ws: WebSocket) => {
          const connectionId = this.generateConnectionId();
          this.connections.set(connectionId, ws);
          this.logger.info({ connectionId }, 'New WebSocket connection');

          ws.on('message', (data: string) => {
            try {
              const message: MCPMessage = JSON.parse(data);
              this.handleMessage(connectionId, message);
            } catch (error) {
              this.logger.error({ error, data }, 'Failed to parse message');
            }
          });

          ws.on('close', () => {
            this.connections.delete(connectionId);
            this.logger.info({ connectionId }, 'WebSocket connection closed');
          });

          ws.on('error', (error: Error) => {
            this.logger.error({ error, connectionId }, 'WebSocket error');
            this.connections.delete(connectionId);
          });
        });

        this.server.on('error', (error: Error) => {
          this.logger.error({ error }, 'WebSocket server error');
          reject(error);
        });

        this.server.on('listening', () => {
          this.logger.info(
            {
              port: this.options.port || 8080,
              host: this.options.host || 'localhost',
              path: this.options.path || '/mcp',
            },
            'WebSocket server started'
          );
          resolve();
        });
      } catch (error) {
        this.logger.error({ error }, 'Failed to start WebSocket server');
        reject(error);
      }
    });
  }

  async stopServer(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.connections.clear();
      this.logger.info('WebSocket server stopped');
    }
  }

  createClientConnection(url: string): MCPConnection {
    const ws = new WebSocket(url);
    let messageHandler: ((message: MCPMessage) => void) | null = null;

    ws.on('open', () => {
      this.logger.info({ url }, 'WebSocket client connected');
    });

    ws.on('message', (data: string) => {
      try {
        const message: MCPMessage = JSON.parse(data);
        if (messageHandler) {
          messageHandler(message);
        }
      } catch (error) {
        this.logger.error({ error, data }, 'Failed to parse message');
      }
    });

    ws.on('close', () => {
      this.logger.info({ url }, 'WebSocket client disconnected');
    });

    ws.on('error', (error: Error) => {
      this.logger.error({ error, url }, 'WebSocket client error');
    });

    return {
      send: async (message: MCPMessage): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message), (error: Error | undefined) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          } else {
            reject(new Error('WebSocket is not connected'));
          }
        });
      },
      onMessage: (callback: (message: MCPMessage) => void): void => {
        messageHandler = callback;
      },
      close: async (): Promise<void> => {
        ws.close();
      },
    };
  }

  private handleMessage(connectionId: string, message: MCPMessage): void {
    // This method should be overridden by the server implementation
    this.logger.debug({ connectionId, message }, 'Received message');
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 