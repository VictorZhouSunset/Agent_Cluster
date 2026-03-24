import { Node, Agent, Session, Message, Document } from './types';

const MOCK_NODES: Node[] = [
  { id: 'n-1', name: 'alpha-worker-01', status: 'online', uptime: '14d 2h', cpu: 42, memory: 68 },
  { id: 'n-2', name: 'beta-worker-02', status: 'online', uptime: '14d 1h', cpu: 28, memory: 45 },
  { id: 'n-3', name: 'gamma-worker-03', status: 'degraded', uptime: '2d 4h', cpu: 95, memory: 88 },
  { id: 'n-4', name: 'delta-worker-04', status: 'offline', uptime: '0m', cpu: 0, memory: 0 },
];

const MOCK_AGENTS: Agent[] = [
  { id: 'a-1', name: 'DataProcessor', nodeId: 'n-1', status: 'busy', lastActive: 'Just now' },
  { id: 'a-2', name: 'CodeReviewer', nodeId: 'n-1', status: 'idle', lastActive: '5m ago' },
  { id: 'a-3', name: 'SystemMonitor', nodeId: 'n-2', status: 'busy', lastActive: 'Just now' },
  { id: 'a-4', name: 'LogAnalyzer', nodeId: 'n-3', status: 'error', lastActive: '1h ago' },
  { id: 'a-5', name: 'SecurityScanner', nodeId: 'n-2', status: 'idle', lastActive: '12m ago' },
];

const MOCK_SESSIONS: Session[] = [
  { id: 's-1', title: 'Analyze Q3 Financials', status: 'active', createdAt: '2026-03-19T10:00:00Z', agentId: 'a-1' },
  { id: 's-2', title: 'Review PR #402', status: 'completed', createdAt: '2026-03-19T09:15:00Z', agentId: 'a-2' },
  { id: 's-3', title: 'Investigate High CPU', status: 'failed', createdAt: '2026-03-19T08:30:00Z', agentId: 'a-4' },
  { id: 's-4', title: 'Scan container images', status: 'active', createdAt: '2026-03-19T10:05:00Z', agentId: 'a-5' },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  's-1': [
    { id: 'm-1', sessionId: 's-1', role: 'user', content: 'Please analyze the Q3 financials.', timestamp: '2026-03-19T10:00:00Z' },
    { id: 'm-2', sessionId: 's-1', role: 'agent', content: 'I have started the analysis. Fetching data from the warehouse...', timestamp: '2026-03-19T10:00:05Z' },
    { id: 'm-3', sessionId: 's-1', role: 'system', content: 'Data fetched successfully (450ms).', timestamp: '2026-03-19T10:00:10Z' },
    { id: 'm-4', sessionId: 's-1', role: 'agent', content: 'The Q3 financials show a 15% increase in revenue compared to Q2. However, operating expenses also rose by 8%. Let me break down the key drivers:\n\n1. **Software Subscriptions**: +22%\n2. **Professional Services**: +5%\n3. **Hardware Sales**: -2%', timestamp: '2026-03-19T10:01:00Z' },
  ],
  's-2': [
    { id: 'm-5', sessionId: 's-2', role: 'user', content: 'Review PR #402 for security issues.', timestamp: '2026-03-19T09:15:00Z' },
    { id: 'm-6', sessionId: 's-2', role: 'agent', content: 'Reviewing PR #402...\n\nI found a potential SQL injection vulnerability in `src/db/queries.ts` on line 45. You are concatenating user input directly into the query string. Please use parameterized queries instead.', timestamp: '2026-03-19T09:16:00Z' },
  ]
};

const MOCK_SKILLS: Record<string, Document[]> = {
  'n-1': [
    { id: 'sk-1', title: 'data_analysis.md', content: '# Data Analysis Skill\n\nThis skill allows the agent to perform complex data aggregations and statistical analysis using pandas and numpy.\n\n## Capabilities\n- Time series forecasting\n- Anomaly detection\n- Correlation analysis', updatedAt: '2026-03-18T12:00:00Z' },
    { id: 'sk-2', title: 'sql_querying.md', content: '# SQL Querying\n\nProvides read-only access to the analytics database.', updatedAt: '2026-03-17T09:00:00Z' },
  ],
  'n-2': [
    { id: 'sk-3', title: 'system_monitoring.md', content: '# System Monitoring\n\nMonitors CPU, memory, and disk usage across the cluster.', updatedAt: '2026-03-19T08:00:00Z' },
  ]
};

const MOCK_FILES: Record<string, Document[]> = {
  'n-1': [
    { id: 'f-1', title: 'AGENTS.md', content: '# Agent Configuration\n\nList of active agents and their assigned roles on this node.\n\n- DataProcessor: handles heavy ETL tasks\n- CodeReviewer: scans incoming PRs', updatedAt: '2026-03-19T01:00:00Z' },
    { id: 'f-2', title: 'config.yaml', content: 'log_level: debug\nmax_concurrent_tasks: 5\ntimeout_seconds: 300', updatedAt: '2026-03-18T15:00:00Z' },
  ]
};

export const apiClient = {
  getNodes: async (): Promise<Node[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_NODES), 300));
  },
  getAgents: async (): Promise<Agent[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_AGENTS), 300));
  },
  getSessions: async (): Promise<Session[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SESSIONS), 300));
  },
  getSessionMessages: async (sessionId: string): Promise<Message[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_MESSAGES[sessionId] || []), 300));
  },
  getSkills: async (nodeId: string): Promise<Document[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SKILLS[nodeId] || []), 300));
  },
  getFiles: async (nodeId: string): Promise<Document[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_FILES[nodeId] || []), 300));
  },
  updateSkill: async (nodeId: string, docId: string, content: string): Promise<Document> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const docs = MOCK_SKILLS[nodeId] || [];
        const doc = docs.find(d => d.id === docId);
        if (doc) {
          doc.content = content;
          doc.updatedAt = new Date().toISOString();
        }
        resolve(doc!);
      }, 500);
    });
  },
  updateFile: async (nodeId: string, docId: string, content: string): Promise<Document> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const docs = MOCK_FILES[nodeId] || [];
        const doc = docs.find(d => d.id === docId);
        if (doc) {
          doc.content = content;
          doc.updatedAt = new Date().toISOString();
        }
        resolve(doc!);
      }, 500);
    });
  }
};
