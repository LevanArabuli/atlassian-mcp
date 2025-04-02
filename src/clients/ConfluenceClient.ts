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
  version: {
    number: number;
  };
  title?: string;
  body?: {
    storage: {
      value: string;
      representation: string;
    };
  };
}

export class ConfluenceClient extends MCPClient {
  constructor(options: MCPClientOptions) {
    super(options);
  }

  // Page Operations
  async searchPages(params: ConfluenceSearchParams): Promise<MCPResponse<ConfluenceSearchResponse>> {
    const { cql, start = 0, limit = 25, expand = [] } = params;

    return this.get<ConfluenceSearchResponse>('/rest/api/content/search', {
      params: {
        cql,
        start,
        limit,
        expand: expand.join(','),
      },
    });
  }

  async getPage(pageId: string): Promise<MCPResponse<ConfluencePage>> {
    return this.get<ConfluencePage>(`/rest/api/content/${pageId}`);
  }

  async createPage(page: ConfluenceCreatePageParams): Promise<MCPResponse<ConfluencePage>> {
    return this.post<ConfluencePage>('/rest/api/content', page);
  }

  async updatePage(
    pageId: string,
    page: ConfluenceUpdatePageParams,
  ): Promise<MCPResponse<ConfluencePage>> {
    return this.put<ConfluencePage>(`/rest/api/content/${pageId}`, page);
  }

  async deletePage(pageId: string): Promise<MCPResponse<void>> {
    return this.delete<void>(`/rest/api/content/${pageId}`);
  }

  // Space Operations
  async getSpaces(): Promise<MCPResponse<{ results: ConfluenceSpace[] }>> {
    return this.get<{ results: ConfluenceSpace[] }>('/rest/api/space');
  }

  async getSpace(spaceKey: string): Promise<MCPResponse<ConfluenceSpace>> {
    return this.get<ConfluenceSpace>(`/rest/api/space/${spaceKey}`);
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