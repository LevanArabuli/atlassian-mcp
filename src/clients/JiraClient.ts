import { JiraClient as AtlassianJiraClient } from '@atlassian/jira-client';
import { MCPClient } from '../core/MCPClient';
import { MCPClientOptions, MCPResponse } from '../types';

export interface JiraIssue {
  id: string;
  key: string;
  fields: Record<string, unknown>;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
}

export interface JiraWorkflow {
  id: string;
  name: string;
  description: string;
  statuses: JiraWorkflowStatus[];
  transitions: JiraWorkflowTransition[];
}

export interface JiraWorkflowStatus {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    key: string;
    colorName: string;
    name: string;
  };
}

export interface JiraWorkflowTransition {
  id: string;
  name: string;
  to: JiraWorkflowStatus;
  type: string;
}

export interface JiraCustomField {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema: {
    type: string;
    items?: string;
    system?: string;
    custom?: string;
    customId?: number;
  };
}

export interface JiraSearchParams {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  expand?: string[];
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraTransitionParams {
  transition: {
    id: string;
    name?: string;
  };
  fields?: Record<string, unknown>;
  update?: {
    comment?: Array<{
      add: {
        body: string;
      };
    }>;
  };
}

export class JiraClient extends MCPClient {
  private readonly jiraClient: AtlassianJiraClient;

  constructor(options: MCPClientOptions) {
    super(options);
    this.jiraClient = new AtlassianJiraClient({
      host: options.baseUrl,
      authentication: {
        basic: {
          email: options.apiToken,
          apiToken: options.apiToken,
        },
      },
    });
  }

  async searchIssues(params: JiraSearchParams): Promise<MCPResponse<JiraSearchResponse>> {
    try {
      const { jql, startAt = 0, maxResults = 50, fields = [], expand = [] } = params;
      
      const response = await this.jiraClient.issues.searchIssues({
        jql,
        startAt,
        maxResults,
        fields: fields.join(','),
        expand: expand.join(','),
      });

      return {
        data: response as JiraSearchResponse,
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async getIssue(issueKey: string): Promise<MCPResponse<JiraIssue>> {
    try {
      const response = await this.jiraClient.issues.getIssue({
        issueKey,
      });

      return {
        data: response as JiraIssue,
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async createIssue(issue: Partial<JiraIssue>): Promise<MCPResponse<JiraIssue>> {
    try {
      const response = await this.jiraClient.issues.createIssue({
        fields: issue.fields,
      });

      return {
        data: response as JiraIssue,
        status: 201,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async updateIssue(issueKey: string, issue: Partial<JiraIssue>): Promise<MCPResponse<void>> {
    try {
      await this.jiraClient.issues.updateIssue({
        issueKey,
        fields: issue.fields,
      });

      return {
        data: undefined,
        status: 204,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteIssue(issueKey: string): Promise<MCPResponse<void>> {
    try {
      await this.jiraClient.issues.deleteIssue({
        issueKey,
      });

      return {
        data: undefined,
        status: 204,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  // Project Operations
  async getProjects(): Promise<MCPResponse<JiraProject[]>> {
    return this.get<JiraProject[]>('/rest/api/3/project');
  }

  async getProject(projectKey: string): Promise<MCPResponse<JiraProject>> {
    return this.get<JiraProject>(`/rest/api/3/project/${projectKey}`);
  }

  // Workflow Operations
  async getWorkflows(projectKey: string): Promise<MCPResponse<JiraWorkflow[]>> {
    try {
      const response = await this.jiraClient.workflows.getProjectWorkflows({
        projectKey,
      });

      return {
        data: response as JiraWorkflow[],
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async getWorkflow(workflowId: string): Promise<MCPResponse<JiraWorkflow>> {
    return this.get<JiraWorkflow>(`/rest/api/3/workflow/${workflowId}`);
  }

  // Custom Field Operations
  async getCustomFields(): Promise<MCPResponse<JiraCustomField[]>> {
    return this.get<JiraCustomField[]>('/rest/api/3/field');
  }

  // Transition Operations
  async getTransitions(issueKey: string): Promise<MCPResponse<JiraWorkflowTransition[]>> {
    return this.get<JiraWorkflowTransition[]>(`/rest/api/3/issue/${issueKey}/transitions`);
  }

  async transitionIssue(
    issueKey: string,
    params: JiraTransitionParams,
  ): Promise<MCPResponse<void>> {
    return this.post<void>(`/rest/api/3/issue/${issueKey}/transitions`, params);
  }

  // Comment Operations
  async getComments(issueKey: string): Promise<MCPResponse<{ comments: Array<{ id: string; body: string }> }>> {
    return this.get<{ comments: Array<{ id: string; body: string }> }>(
      `/rest/api/3/issue/${issueKey}/comment`,
    );
  }

  async addComment(
    issueKey: string,
    comment: { body: string },
  ): Promise<MCPResponse<{ id: string; body: string }>> {
    return this.post<{ id: string; body: string }>(`/rest/api/3/issue/${issueKey}/comment`, comment);
  }

  async updateComment(
    issueKey: string,
    commentId: string,
    comment: { body: string },
  ): Promise<MCPResponse<{ id: string; body: string }>> {
    return this.put<{ id: string; body: string }>(
      `/rest/api/3/issue/${issueKey}/comment/${commentId}`,
      comment,
    );
  }

  async deleteComment(issueKey: string, commentId: string): Promise<MCPResponse<void>> {
    return this.delete<void>(`/rest/api/3/issue/${issueKey}/comment/${commentId}`);
  }
} 