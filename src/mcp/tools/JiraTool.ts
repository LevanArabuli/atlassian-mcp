import { MCPTool, MCPMethod, MCPParameter } from '../protocol/types';
import { JiraClient } from '../../clients/JiraClient';
import { JiraIssue, JiraSearchParams } from '../../clients/JiraClient';

export class JiraTool {
  private readonly tool: MCPTool;

  constructor(private readonly jiraClient: JiraClient) {
    this.tool = {
      name: 'jira',
      version: '1.0.0',
      description: 'Jira integration tool for MCP',
      methods: [
        this.createIssueMethod(),
        this.getIssueMethod(),
        this.updateIssueMethod(),
        this.searchIssuesMethod(),
      ],
    };
  }

  getTool(): MCPTool {
    return this.tool;
  }

  private createIssueMethod(): MCPMethod {
    return {
      name: 'createIssue',
      description: 'Create a new Jira issue',
      parameters: [
        {
          name: 'projectKey',
          type: 'string',
          description: 'The project key',
          required: true,
        },
        {
          name: 'summary',
          type: 'string',
          description: 'The issue summary',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'The issue description',
          required: true,
        },
        {
          name: 'issueType',
          type: 'string',
          description: 'The issue type (e.g., Task, Bug, Story)',
          required: true,
        },
        {
          name: 'priority',
          type: 'string',
          description: 'The issue priority (e.g., High, Medium, Low)',
          required: false,
        },
        {
          name: 'labels',
          type: 'string[]',
          description: 'Array of labels to apply to the issue',
          required: false,
        },
      ],
      returns: {
        name: 'issue',
        type: 'object',
        description: 'The created Jira issue',
      },
    };
  }

  private getIssueMethod(): MCPMethod {
    return {
      name: 'getIssue',
      description: 'Get a Jira issue by key',
      parameters: [
        {
          name: 'issueKey',
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
          required: true,
        },
      ],
      returns: {
        name: 'issue',
        type: 'object',
        description: 'The Jira issue',
      },
    };
  }

  private updateIssueMethod(): MCPMethod {
    return {
      name: 'updateIssue',
      description: 'Update a Jira issue',
      parameters: [
        {
          name: 'issueKey',
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
          required: true,
        },
        {
          name: 'fields',
          type: 'object',
          description: 'The fields to update',
          required: true,
        },
      ],
      returns: {
        name: 'issue',
        type: 'object',
        description: 'The updated Jira issue',
      },
    };
  }

  private searchIssuesMethod(): MCPMethod {
    return {
      name: 'searchIssues',
      description: 'Search for Jira issues using JQL',
      parameters: [
        {
          name: 'jql',
          type: 'string',
          description: 'The JQL query string',
          required: true,
        },
        {
          name: 'startAt',
          type: 'number',
          description: 'The index of the first result to return',
          required: false,
        },
        {
          name: 'maxResults',
          type: 'number',
          description: 'The maximum number of results to return',
          required: false,
        },
        {
          name: 'fields',
          type: 'string[]',
          description: 'Array of fields to include in the response',
          required: false,
        },
      ],
      returns: {
        name: 'searchResults',
        type: 'object',
        description: 'The search results containing issues and metadata',
      },
    };
  }

  async executeMethod(methodName: string, params: Record<string, unknown>): Promise<unknown> {
    switch (methodName) {
      case 'createIssue': {
        const issue: Partial<JiraIssue> = {
          fields: {
            project: { key: params.projectKey as string },
            summary: params.summary as string,
            description: params.description as string,
            issuetype: { name: params.issueType as string },
            priority: params.priority ? { name: params.priority as string } : undefined,
            labels: params.labels as string[],
          },
        };
        return this.jiraClient.createIssue(issue);
      }
      case 'getIssue':
        return this.jiraClient.getIssue(params.issueKey as string);
      case 'updateIssue': {
        const issue: Partial<JiraIssue> = {
          fields: params.fields as Record<string, unknown>,
        };
        return this.jiraClient.updateIssue(params.issueKey as string, issue);
      }
      case 'searchIssues': {
        const searchParams: JiraSearchParams = {
          jql: params.jql as string,
          startAt: params.startAt as number,
          maxResults: params.maxResults as number,
          fields: params.fields as string[],
        };
        return this.jiraClient.searchIssues(searchParams);
      }
      default:
        throw new Error(`Unknown method: ${methodName}`);
    }
  }
} 