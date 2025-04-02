import { MCPTool, MCPMethod, MCPParameter } from '../protocol/types';
import { ConfluenceClient } from '../../clients/ConfluenceClient';
import { ConfluenceCreatePageParams, ConfluenceUpdatePageParams, ConfluenceSearchParams } from '../../clients/ConfluenceClient';

export class ConfluenceTool {
  private readonly tool: MCPTool;

  constructor(private readonly confluenceClient: ConfluenceClient) {
    this.tool = {
      name: 'confluence',
      version: '1.0.0',
      description: 'Confluence integration tool for MCP',
      methods: [
        this.createPageMethod(),
        this.getPageMethod(),
        this.updatePageMethod(),
        this.deletePageMethod(),
        this.searchPagesMethod(),
      ],
    };
  }

  getTool(): MCPTool {
    return this.tool;
  }

  private createPageMethod(): MCPMethod {
    return {
      name: 'createPage',
      description: 'Create a new Confluence page',
      parameters: [
        {
          name: 'spaceKey',
          type: 'string',
          description: 'The space key',
          required: true,
        },
        {
          name: 'title',
          type: 'string',
          description: 'The page title',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: 'The page content in XHTML format',
          required: true,
        },
        {
          name: 'parentId',
          type: 'string',
          description: 'The ID of the parent page',
          required: false,
        },
      ],
      returns: {
        name: 'page',
        type: 'object',
        description: 'The created Confluence page',
      },
    };
  }

  private getPageMethod(): MCPMethod {
    return {
      name: 'getPage',
      description: 'Get a Confluence page by ID',
      parameters: [
        {
          name: 'pageId',
          type: 'string',
          description: 'The page ID',
          required: true,
        },
      ],
      returns: {
        name: 'page',
        type: 'object',
        description: 'The Confluence page',
      },
    };
  }

  private updatePageMethod(): MCPMethod {
    return {
      name: 'updatePage',
      description: 'Update a Confluence page',
      parameters: [
        {
          name: 'pageId',
          type: 'string',
          description: 'The page ID',
          required: true,
        },
        {
          name: 'title',
          type: 'string',
          description: 'The new page title',
          required: false,
        },
        {
          name: 'content',
          type: 'string',
          description: 'The new page content in XHTML format',
          required: false,
        },
        {
          name: 'version',
          type: 'number',
          description: 'The current version number',
          required: true,
        },
      ],
      returns: {
        name: 'page',
        type: 'object',
        description: 'The updated Confluence page',
      },
    };
  }

  private deletePageMethod(): MCPMethod {
    return {
      name: 'deletePage',
      description: 'Delete a Confluence page',
      parameters: [
        {
          name: 'pageId',
          type: 'string',
          description: 'The page ID',
          required: true,
        },
      ],
      returns: {
        name: 'success',
        type: 'boolean',
        description: 'Whether the deletion was successful',
      },
    };
  }

  private searchPagesMethod(): MCPMethod {
    return {
      name: 'searchPages',
      description: 'Search for Confluence pages',
      parameters: [
        {
          name: 'cql',
          type: 'string',
          description: 'The Confluence Query Language (CQL) query string',
          required: true,
        },
        {
          name: 'start',
          type: 'number',
          description: 'The index of the first result to return',
          required: false,
        },
        {
          name: 'limit',
          type: 'number',
          description: 'The maximum number of results to return',
          required: false,
        },
        {
          name: 'expand',
          type: 'string[]',
          description: 'Array of fields to expand in the response',
          required: false,
        },
      ],
      returns: {
        name: 'searchResults',
        type: 'object',
        description: 'The search results containing pages and metadata',
      },
    };
  }

  async executeMethod(methodName: string, params: Record<string, unknown>): Promise<unknown> {
    switch (methodName) {
      case 'createPage': {
        const page: ConfluenceCreatePageParams = {
          type: 'page',
          title: params.title as string,
          space: {
            key: params.spaceKey as string,
          },
          body: {
            storage: {
              value: params.content as string,
              representation: 'storage',
            },
          },
        };
        return this.confluenceClient.createPage(page);
      }
      case 'getPage':
        return this.confluenceClient.getPage(params.pageId as string);
      case 'updatePage': {
        const page: ConfluenceUpdatePageParams = {
          type: 'page',
          title: params.title as string,
          body: {
            storage: {
              value: params.content as string,
              representation: 'storage',
            },
          },
          version: {
            number: params.version as number,
          },
        };
        return this.confluenceClient.updatePage(params.pageId as string, page);
      }
      case 'deletePage':
        return this.confluenceClient.deletePage(params.pageId as string);
      case 'searchPages': {
        const searchParams: ConfluenceSearchParams = {
          cql: params.cql as string,
          start: params.start as number,
          limit: params.limit as number,
          expand: params.expand as string[],
        };
        return this.confluenceClient.searchPages(searchParams);
      }
      default:
        throw new Error(`Unknown method: ${methodName}`);
    }
  }
} 