import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Server } from '@modelcontextprotocol/server';
import { z } from 'zod';

const mockOperations = {
  collections: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  records: {
    query: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  users: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  files: {
    list: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
  },
  debugging: {
    getLogs: vi.fn(),
  },
  development: {
    generateTypeScriptTypes: vi.fn(),
    getApiUrl: vi.fn(),
    getHealthStatus: vi.fn(),
  },
};

describe('Development Tools', () => {
  let createDevelopmentTools: any;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    server = {
      tool: vi.fn(),
    };
    
    try {
      const module = await import('../../src/tools/development-tools');
      createDevelopmentTools = module.createDevelopmentTools;
    } catch (error) {
      createDevelopmentTools = undefined;
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Tool Registration', () => {
    it('should export createDevelopmentTools function', () => {
      expect(createDevelopmentTools).toBeDefined();
      expect(typeof createDevelopmentTools).toBe('function');
    });

    it('should register generate_typescript_types tool', () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      createDevelopmentTools(server, mockOperations);
      
      const generateTypesCall = server.tool.mock.calls.find(
        call => call[0] === 'generate_typescript_types'
      );
      
      expect(generateTypesCall).toBeDefined();
      expect(generateTypesCall[0]).toBe('generate_typescript_types');
    });

    it('should register get_api_url tool', () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      createDevelopmentTools(server, mockOperations);
      
      const getApiUrlCall = server.tool.mock.calls.find(
        call => call[0] === 'get_api_url'
      );
      
      expect(getApiUrlCall).toBeDefined();
      expect(getApiUrlCall[0]).toBe('get_api_url');
    });

    it('should register get_health_status tool', () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      createDevelopmentTools(server, mockOperations);
      
      const getHealthStatusCall = server.tool.mock.calls.find(
        call => call[0] === 'get_health_status'
      );
      
      expect(getHealthStatusCall).toBeDefined();
      expect(getHealthStatusCall[0]).toBe('get_health_status');
    });
  });

  describe('generate_typescript_types', () => {
    it('should generate TypeScript types from collection schemas', async () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      const mockTypes = `
export interface Collections {
  users: Users;
  posts: Posts;
}

export interface Users {
  id: string;
  email: string;
  created: string;
  updated: string;
}

export interface Posts {
  id: string;
  title: string;
  content: string;
  created: string;
  updated: string;
}
`;
      
      mockOperations.development.generateTypeScriptTypes.mockResolvedValue(mockTypes);
      
      createDevelopmentTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'generate_typescript_types'
      )[3];
      
      const result = await handler();
      
      expect(mockOperations.development.generateTypeScriptTypes).toHaveBeenCalled();
      expect(result.content[0].text).toContain('export interface');
    });

    it('should handle type generation errors', async () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      const error = new Error('Failed to generate types');
      mockOperations.development.generateTypeScriptTypes.mockRejectedValue(error);
      
      createDevelopmentTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'generate_typescript_types'
      )[3];
      
      const result = await handler();
      
      expect(result.isError).toBe(true);
    });
  });

  describe('get_api_url', () => {
    it('should return the API base URL', async () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      const mockUrl = 'https://pocketbase.example.com/api';
      mockOperations.development.getApiUrl.mockResolvedValue(mockUrl);
      
      createDevelopmentTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_api_url'
      )[3];
      
      const result = await handler();
      
      expect(mockOperations.development.getApiUrl).toHaveBeenCalled();
      expect(JSON.parse(result.content[0].text)).toBe(mockUrl);
    });
  });

  describe('get_health_status', () => {
    it('should return instance health status', async () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      const mockHealth = {
        status: 'ok',
        version: '0.22.0',
        uptime: 86400,
        connections: 15,
      };
      
      mockOperations.development.getHealthStatus.mockResolvedValue(mockHealth);
      
      createDevelopmentTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_health_status'
      )[3];
      
      const result = await handler();
      
      expect(mockOperations.development.getHealthStatus).toHaveBeenCalled();
      expect(JSON.parse(result.content[0].text)).toEqual(mockHealth);
    });

    it('should handle health check failures', async () => {
      if (!createDevelopmentTools) {
        expect(createDevelopmentTools).toBeDefined();
        return;
      }

      const error = new Error('Health check failed');
      mockOperations.development.getHealthStatus.mockRejectedValue(error);
      
      createDevelopmentTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_health_status'
      )[3];
      
      const result = await handler();
      
      expect(result.isError).toBe(true);
    });
  });
});
