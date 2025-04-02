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
  constructor(options: MCPClientOptions) {
    super(options);
  }

  // Issue Operations
  async searchIssues(params: JiraSearchParams): Promise<MCPResponse<JiraSearchResponse>> {
    const { jql, startAt = 0, maxResults = 50, fields = [], expand = [] } = params;

    return this.get<JiraSearchResponse>('/rest/api/3/search', {
      params: {
        jql,
        startAt,
        maxResults,
        fields: fields.join(','),
        expand: expand.join(','),
      },
    });
  }

  async getIssue(issueKey: string): Promise<MCPResponse<JiraIssue>> {
    return this.get<JiraIssue>(`/rest/api/3/issue/${issueKey}`);
  }

  async createIssue(issue: Partial<JiraIssue>): Promise<MCPResponse<JiraIssue>> {
    return this.post<JiraIssue>('/rest/api/3/issue', issue);
  }

  async updateIssue(
    issueKey: string,
    issue: Partial<JiraIssue>,
  ): Promise<MCPResponse<void>> {
    return this.put<void>(`/rest/api/3/issue/${issueKey}`, issue);
  }

  async deleteIssue(issueKey: string): Promise<MCPResponse<void>> {
    return this.delete<void>(`/rest/api/3/issue/${issueKey}`);
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
    return this.get<JiraWorkflow[]>(`/rest/api/3/workflow/project/${projectKey}`);
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