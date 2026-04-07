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

describe('Debug Tools', () => {
  let createDebugTools: any;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    server = {
      tool: vi.fn(),
    };
    
    try {
      const module = await import('../../src/tools/debug-tools');
      createDebugTools = module.createDebugTools;
    } catch (error) {
      createDebugTools = undefined;
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Tool Registration', () => {
    it('should export createDebugTools function', () => {
      expect(createDebugTools).toBeDefined();
      expect(typeof createDebugTools).toBe('function');
    });

    it('should register get_logs tool', () => {
      if (!createDebugTools) {
        expect(createDebugTools).toBeDefined();
        return;
      }

      createDebugTools(server, mockOperations);
      
      const getLogsCall = server.tool.mock.calls.find(
        call => call[0] === 'get_logs'
      );
      
      expect(getLogsCall).toBeDefined();
      expect(getLogsCall[0]).toBe('get_logs');
    });
  });

  describe('get_logs', () => {
    it('should return instance logs', async () => {
      if (!createDebugTools) {
        expect(createDebugTools).toBeDefined();
        return;
      }

      const mockLogs = {
        items: [
          { level: 'info', message: 'Server started', timestamp: '2026-04-08T00:00:00Z' },
          { level: 'error', message: 'Connection failed', timestamp: '2026-04-08T00:01:00Z' },
        ],
        total: 2,
      };
      
      mockOperations.debugging.getLogs.mockResolvedValue(mockLogs);
      
      createDebugTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_logs'
      )[3];
      
      const result = await handler({ limit: 50 });
      
      expect(mockOperations.debugging.getLogs).toHaveBeenCalledWith({ limit: 50 });
      expect(JSON.parse(result.content[0].text)).toEqual(mockLogs);
    });

    it('should use default limit when not specified', async () => {
      if (!createDebugTools) {
        expect(createDebugTools).toBeDefined();
        return;
      }

      const mockLogs = { items: [], total: 0 };
      mockOperations.debugging.getLogs.mockResolvedValue(mockLogs);
      
      createDebugTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_logs'
      )[3];
      
      await handler({});
      
      expect(mockOperations.debugging.getLogs).toHaveBeenCalled();
    });

    it('should handle log retrieval errors', async () => {
      if (!createDebugTools) {
        expect(createDebugTools).toBeDefined();
        return;
      }

      const error = new Error('Failed to fetch logs');
      mockOperations.debugging.getLogs.mockRejectedValue(error);
      
      createDebugTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_logs'
      )[3];
      
      const result = await handler({ limit: 50 });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });
});
