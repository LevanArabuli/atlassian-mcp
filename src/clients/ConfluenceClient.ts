import { ConfluenceClient as AtlassianConfluenceClient } from '@atlassian/confluence-client';
import { MCPClient } from '../core/MCPClient';
import { MCPClientOptions, MCPResponse } from '../types';

export interface ConfluencePage {
  id: string;
  type: string;
  status: string;
  title: string;
  space: {
    id: string;
    key: string;
    type: string;
  };
  version: {
    number: number;
  };
  body: {
    storage: {
      value: string;
      representation: string;
    };
  };
}

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
  homepage: {
    id: string;
    type: string;
  };
  settings: {
    routeOverrideEnabled: boolean;
  };
}

export interface ConfluenceAttachment {
  id: string;
  type: string;
  title: string;
  metadata: {
    mediaType: string;
    size: number;
  };
  version: {
    number: number;
  };
  _links: {
    download: string;
    webui: string;
  };
}

export interface ConfluenceSearchParams {
  cql: string;
  start?: number;
  limit?: number;
  expand?: string[];
}

export interface ConfluenceSearchResponse {
  results: ConfluencePage[];
  size: number;
  start: number;
  limit: number;
  totalSize: number;
}

export interface ConfluenceCreatePageParams {
  type: string;
  title: string;
  space: {
    key: string;
  };
  body: {
    storage: {
      value: string;
      representation: string;
    };
  };
  version?: {
    number: number;
  };
}

export interface ConfluenceUpdatePageParams {
  type: string;
  title: string;
  body: {
    storage: {
      value: string;
      representation: string;
    };
  };
  version?: {
    number: number;
  };
}

export class ConfluenceClient extends MCPClient {
  private readonly confluenceClient: AtlassianConfluenceClient;

  constructor(options: MCPClientOptions) {
    super(options);
    this.confluenceClient = new AtlassianConfluenceClient({
      host: options.baseUrl,
      authentication: {
        basic: {
          email: options.apiToken,
          apiToken: options.apiToken,
        },
      },
    });
  }

  async searchPages(params: ConfluenceSearchParams): Promise<MCPResponse<ConfluenceSearchResponse>> {
    try {
      const { cql, start = 0, limit = 25, expand = [] } = params;
      
      const response = await this.confluenceClient.content.searchContent({
        cql,
        start,
        limit,
        expand: expand.join(','),
      });

      return {
        data: response as ConfluenceSearchResponse,
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async getPage(pageId: string): Promise<MCPResponse<ConfluencePage>> {
    try {
      const response = await this.confluenceClient.content.getContentById({
        id: pageId,
      });

      return {
        data: response as ConfluencePage,
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async createPage(page: ConfluenceCreatePageParams): Promise<MCPResponse<ConfluencePage>> {
    try {
      const response = await this.confluenceClient.content.createContent({
        type: page.type,
        title: page.title,
        space: page.space,
        body: page.body,
        version: page.version,
      });

      return {
        data: response as ConfluencePage,
        status: 201,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePage(pageId: string, page: ConfluenceUpdatePageParams): Promise<MCPResponse<ConfluencePage>> {
    try {
      const response = await this.confluenceClient.content.updateContent({
        id: pageId,
        type: page.type,
        title: page.title,
        body: page.body,
        version: page.version,
      });

      return {
        data: response as ConfluencePage,
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async deletePage(pageId: string): Promise<MCPResponse<void>> {
    try {
      await this.confluenceClient.content.deleteContent({
        id: pageId,
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

  async getSpaces(): Promise<MCPResponse<{ results: ConfluenceSpace[] }>> {
    try {
      const response = await this.confluenceClient.space.getSpaces();

      return {
        data: { results: response as ConfluenceSpace[] },
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async getSpace(spaceKey: string): Promise<MCPResponse<ConfluenceSpace>> {
    try {
      const response = await this.confluenceClient.space.getSpace({
        spaceKey,
      });

      return {
        data: response as ConfluenceSpace,
        status: 200,
        headers: {},
      };
    } catch (error) {
      throw error;
    }
  }

  // Attachment Operations
  async getAttachments(pageId: string): Promise<MCPResponse<{ results: ConfluenceAttachment[] }>> {
    return this.get<{ results: ConfluenceAttachment[] }>(
      `/rest/api/content/${pageId}/child/attachment`,
    );
  }

  async uploadAttachment(
    pageId: string,
    file: Buffer,
    filename: string,
  ): Promise<MCPResponse<ConfluenceAttachment>> {
    const formData = new FormData();
    formData.append('file', new Blob([file]), filename);

    return this.post<ConfluenceAttachment>(`/rest/api/content/${pageId}/child/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteAttachment(pageId: string, attachmentId: string): Promise<MCPResponse<void>> {
    return this.delete<void>(`/rest/api/content/${pageId}/child/attachment/${attachmentId}`);
  }

  // Child Page Operations
  async getChildPages(pageId: string): Promise<MCPResponse<{ results: ConfluencePage[] }>> {
    return this.get<{ results: ConfluencePage[] }>(`/rest/api/content/${pageId}/child/page`);
  }

  // Label Operations
  async addLabel(pageId: string, label: string): Promise<MCPResponse<void>> {
    return this.post<void>(`/rest/api/content/${pageId}/label`, { name: label });
  }

  async removeLabel(pageId: string, label: string): Promise<MCPResponse<void>> {
    return this.delete<void>(`/rest/api/content/${pageId}/label/${label}`);
  }

  async getLabels(pageId: string): Promise<MCPResponse<{ results: Array<{ name: string }> }>> {
    return this.get<{ results: Array<{ name: string }> }>(`/rest/api/content/${pageId}/label`);
  }
} 