import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { JiraClient } from './JiraClient';
import { mockClientOptions, mockJiraIssue } from '../test/helpers';
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

describe('JiraClient', () => {
  let client: JiraClient;
  let mockAxiosInstance: ReturnType<typeof axios.create>;

  beforeEach(() => {
    client = new JiraClient(mockClientOptions);
    mockAxiosInstance = (axios.create as ReturnType<typeof vi.fn>)();
    vi.clearAllMocks();
  });

  describe('searchIssues', () => {
    it('should search issues with correct parameters', async () => {
      const mockResponse = {
        data: {
          issues: [mockJiraIssue],
          total: 1,
          startAt: 0,
          maxResults: 50,
        },
        status: 200,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const result = await client.searchIssues({
        jql: 'project = TEST',
        fields: ['summary'],
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/rest/api/3/search',
          params: {
            jql: 'project = TEST',
            fields: 'summary',
            startAt: 0,
            maxResults: 50,
            expand: '',
          },
        }),
      );

      expect(result.data.issues).toHaveLength(1);
      expect(result.data.issues[0]).toEqual(mockJiraIssue);
    });

    it('should handle search errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            errorMessages: ['Invalid JQL'],
          },
        },
      };

      vi.mocked(mockAxiosInstance.request).mockRejectedValueOnce(errorResponse);

      await expect(
        client.searchIssues({
          jql: 'invalid query',
        }),
      ).rejects.toThrow(MCPRequestError);
    });
  });

  describe('getIssue', () => {
    it('should get issue by key', async () => {
      const mockResponse = {
        data: mockJiraIssue,
        status: 200,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const result = await client.getIssue('TEST-123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/rest/api/3/issue/TEST-123',
        }),
      );

      expect(result.data).toEqual(mockJiraIssue);
    });

    it('should handle get issue errors', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            errorMessages: ['Issue does not exist'],
          },
        },
      };

      vi.mocked(mockAxiosInstance.request).mockRejectedValueOnce(errorResponse);

      await expect(client.getIssue('INVALID-123')).rejects.toThrow(MCPRequestError);
    });
  });

  describe('createIssue', () => {
    it('should create issue with correct data', async () => {
      const mockResponse = {
        data: mockJiraIssue,
        status: 201,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const newIssue = {
        fields: {
          project: { key: 'TEST' },
          summary: 'Test Issue',
          description: 'Test Description',
          issuetype: { name: 'Task' },
        },
      };

      const result = await client.createIssue(newIssue);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/rest/api/3/issue',
          data: newIssue,
        }),
      );

      expect(result.data).toEqual(mockJiraIssue);
    });
  });

  describe('updateIssue', () => {
    it('should update issue with correct data', async () => {
      const mockResponse = {
        data: undefined,
        status: 204,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      const updateData = {
        fields: {
          summary: 'Updated Summary',
        },
      };

      await client.updateIssue('TEST-123', updateData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: '/rest/api/3/issue/TEST-123',
          data: updateData,
        }),
      );
    });
  });

  describe('deleteIssue', () => {
    it('should delete issue by key', async () => {
      const mockResponse = {
        data: undefined,
        status: 204,
        headers: {},
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValueOnce(mockResponse);

      await client.deleteIssue('TEST-123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: '/rest/api/3/issue/TEST-123',
        }),
      );
    });
  });
}); 