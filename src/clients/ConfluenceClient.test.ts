import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import { ConfluenceClient } from './ConfluenceClient';
import { mockClientOptions, mockConfluencePage } from '../test/helpers';
import { MCPRequestError } from '../utils/errors';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      request: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

describe('ConfluenceClient', () => {
  let client: ConfluenceClient;
  let mockAxiosInstance: ReturnType<typeof axios.create>;

  beforeEach(() => {
    client = new ConfluenceClient(mockClientOptions);
    mockAxiosInstance = (axios.create as ReturnType<typeof vi.fn>)();
    vi.clearAllMocks();
  });

  describe('searchPages', () => {
    it('should search pages with correct parameters', async () => {
      const mockResponse = {
        data: {
          results: [mockConfluencePage],
          size: 1,
          start: 0,
          limit: 25,
          totalSize: 1,
        },
        status: 200,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const result = await client.searchPages({
        cql: 'space = TEST',
        expand: ['body.storage'],
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/rest/api/content/search',
          params: {
            cql: 'space = TEST',
            start: 0,
            limit: 25,
            expand: 'body.storage',
          },
        }),
      );

      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0]).toEqual(mockConfluencePage);
    });

    it('should handle search errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid CQL',
          },
        },
      };

      vi.mocked(mockAxiosInstance.request).mockRejectedValueOnce(errorResponse);

      await expect(
        client.searchPages({
          cql: 'invalid query',
        }),
      ).rejects.toThrow(MCPRequestError);
    });
  });

  describe('getPage', () => {
    it('should get page by id', async () => {
      const mockResponse = {
        data: mockConfluencePage,
        status: 200,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const result = await client.getPage('456');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/rest/api/content/456',
        }),
      );

      expect(result.data).toEqual(mockConfluencePage);
    });

    it('should handle get page errors', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Page does not exist',
          },
        },
      };

      vi.mocked(mockAxiosInstance.request).mockRejectedValueOnce(errorResponse);

      await expect(client.getPage('invalid-id')).rejects.toThrow(MCPRequestError);
    });
  });

  describe('createPage', () => {
    it('should create page with correct data', async () => {
      const mockResponse = {
        data: mockConfluencePage,
        status: 201,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const newPage = {
        type: 'page',
        title: 'Test Page',
        space: { key: 'TEST' },
        body: {
          storage: {
            value: '<p>Test Content</p>',
            representation: 'storage',
          },
        },
      };

      const result = await client.createPage(newPage);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/rest/api/content',
          data: newPage,
        }),
      );

      expect(result.data).toEqual(mockConfluencePage);
    });
  });

  describe('updatePage', () => {
    it('should update page with correct data', async () => {
      const mockResponse = {
        data: mockConfluencePage,
        status: 200,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const updateData = {
        version: { number: 2 },
        title: 'Updated Title',
        body: {
          storage: {
            value: '<p>Updated Content</p>',
            representation: 'storage',
          },
        },
      };

      await client.updatePage('456', updateData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: '/rest/api/content/456',
          data: updateData,
        }),
      );
    });
  });

  describe('deletePage', () => {
    it('should delete page by id', async () => {
      const mockResponse = {
        data: undefined,
        status: 204,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      await client.deletePage('456');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: '/rest/api/content/456',
        }),
      );
    });
  });
}); 