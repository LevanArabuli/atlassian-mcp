import { MCPClientOptions } from '../types';

export const mockClientOptions: MCPClientOptions = {
  baseUrl: 'https://test.atlassian.com',
  apiToken: 'test-token',
  timeout: 5000,
  logger: {
    level: 'silent',
  },
};

export const mockJiraIssue = {
  id: '123',
  key: 'TEST-123',
  fields: {
    summary: 'Test Issue',
    description: 'Test Description',
    project: {
      key: 'TEST',
    },
    issuetype: {
      name: 'Task',
    },
  },
};

export const mockConfluencePage = {
  id: '456',
  type: 'page',
  status: 'current',
  title: 'Test Page',
  space: {
    id: '789',
    key: 'TEST',
    type: 'global',
  },
  version: {
    number: 1,
  },
  body: {
    storage: {
      value: '<p>Test Content</p>',
      representation: 'storage',
    },
  },
}; 