export type MCPMessageType = 
  | 'register'
  | 'unregister'
  | 'command'
  | 'response'
  | 'event'
  | 'error';

export interface MCPMessage {
  type: MCPMessageType;
  id: string;
  timestamp: number;
  payload: unknown;
}

export interface MCPCommand extends MCPMessage {
  type: 'command';
  tool: string;
  method: string;
  params: Record<string, unknown>;
}

export interface MCPResponse extends Omit<MCPMessage, 'payload'> {
  type: 'response';
  commandId: string;
  success: boolean;
  data?: unknown;
  error?: MCPError;
}

export interface MCPEvent extends MCPMessage {
  type: 'event';
  eventName: string;
  data: unknown;
}

export interface MCPError {
  code: string;
  message: string;
  details?: unknown;
}

export interface MCPTool {
  name: string;
  version: string;
  description: string;
  methods: MCPMethod[];
}

export interface MCPMethod {
  name: string;
  description: string;
  parameters: MCPParameter[];
  returns: MCPParameter;
}

export interface MCPParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface MCPConnection {
  send(message: MCPMessage): Promise<void>;
  onMessage(callback: (message: MCPMessage) => void): void;
  close(): Promise<void>;
} 