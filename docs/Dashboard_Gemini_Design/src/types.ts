export interface Node {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
  cpu: number;
  memory: number;
}

export interface Agent {
  id: string;
  name: string;
  nodeId: string;
  status: 'idle' | 'busy' | 'error';
  lastActive: string;
}

export interface Session {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  agentId: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}
