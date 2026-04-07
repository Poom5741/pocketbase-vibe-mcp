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

describe('Collection Tools', () => {
  let createCollectionTools: any;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    server = {
      tool: vi.fn(),
    };
    
    try {
      const module = await import('../../src/tools/collection-tools');
      createCollectionTools = module.createCollectionTools;
    } catch (error) {
      createCollectionTools = undefined;
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Tool Registration', () => {
    it('should export createCollectionTools function', () => {
      expect(createCollectionTools).toBeDefined();
      expect(typeof createCollectionTools).toBe('function');
    });

    it('should register list_collections tool with correct schema', () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      createCollectionTools(server, mockOperations);
      
      const listCollectionsCall = server.tool.mock.calls.find(
        call => call[0] === 'list_collections'
      );
      
      expect(listCollectionsCall).toBeDefined();
      expect(listCollectionsCall[0]).toBe('list_collections');
      expect(listCollectionsCall[1]).toContain('List all collection');
      expect(listCollectionsCall[2]).toBeInstanceOf(z.ZodObject);
    });

    it('should register get_collection tool with name parameter', () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      createCollectionTools(server, mockOperations);
      
      const getCollectionCall = server.tool.mock.calls.find(
        call => call[0] === 'get_collection'
      );
      
      expect(getCollectionCall).toBeDefined();
      expect(getCollectionCall[0]).toBe('get_collection');
      expect(getCollectionCall[2]).toBeInstanceOf(z.ZodObject);
    });

    it('should register create_collection tool', () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      createCollectionTools(server, mockOperations);
      
      const createCollectionCall = server.tool.mock.calls.find(
        call => call[0] === 'create_collection'
      );
      
      expect(createCollectionCall).toBeDefined();
      expect(createCollectionCall[0]).toBe('create_collection');
    });

    it('should register update_collection tool', () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      createCollectionTools(server, mockOperations);
      
      const updateCollectionCall = server.tool.mock.calls.find(
        call => call[0] === 'update_collection'
      );
      
      expect(updateCollectionCall).toBeDefined();
      expect(updateCollectionCall[0]).toBe('update_collection');
    });

    it('should register delete_collection tool', () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      createCollectionTools(server, mockOperations);
      
      const deleteCollectionCall = server.tool.mock.calls.find(
        call => call[0] === 'delete_collection'
      );
      
      expect(deleteCollectionCall).toBeDefined();
      expect(deleteCollectionCall[0]).toBe('delete_collection');
    });
  });

  describe('list_collections', () => {
    it('should return all collections successfully', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      const mockCollections = [
        { id: '1', name: 'users', type: 'auth' },
        { id: '2', name: 'posts', type: 'base' },
      ];
      
      mockOperations.collections.list.mockResolvedValue(mockCollections);
      
      createCollectionTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'list_collections'
      )[3];
      
      const result = await handler();
      
      expect(mockOperations.collections.list).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockCollections);
    });

    it('should handle PocketBase API errors', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      const error = new Error('Failed to fetch collections');
      mockOperations.collections.list.mockRejectedValue(error);
      
      createCollectionTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'list_collections'
      )[3];
      
      const result = await handler();
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('get_collection', () => {
    it('should return a single collection by name', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      const mockCollection = { id: '1', name: 'users', type: 'auth' };
      mockOperations.collections.get.mockResolvedValue(mockCollection);
      
      createCollectionTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_collection'
      )[3];
      
      const result = await handler({ name: 'users' });
      
      expect(mockOperations.collections.get).toHaveBeenCalledWith('users');
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockCollection);
    });

    it('should handle collection not found', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      const error = new Error('Collection not found');
      (error as any).status = 404;
      mockOperations.collections.get.mockRejectedValue(error);
      
      createCollectionTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_collection'
      )[3];
      
      const result = await handler({ name: 'nonexistent' });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('create_collection', () => {
    it('should create a new collection', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      const newSchema = { name: 'posts', type: 'base', fields: [] };
      const mockCreated = { id: '3', ...newSchema };
      mockOperations.collections.create.mockResolvedValue(mockCreated);
      
      createCollectionTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'create_collection'
      )[3];
      
      const result = await handler({ schema: newSchema });
      
      expect(mockOperations.collections.create).toHaveBeenCalledWith(newSchema);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockCreated);
    });

    it('should fail in read-only mode', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      mockOperations.collections.create.mockRejectedValue(
        new Error('Operation blocked in read-only mode')
      );
      
      createCollectionTools(server, mockOperations, { readOnly: true });
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'create_collection'
      )[3];
      
      const result = await handler({ schema: { name: 'test', type: 'base' } });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read-only mode');
    });
  });

  describe('update_collection', () => {
    it('should update an existing collection', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      const updates = { name: 'posts_updated', type: 'base' };
      const mockUpdated = { id: '2', ...updates };
      mockOperations.collections.update.mockResolvedValue(mockUpdated);
      
      createCollectionTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'update_collection'
      )[3];
      
      const result = await handler({ name: 'posts', schema: updates });
      
      expect(mockOperations.collections.update).toHaveBeenCalledWith('posts', updates);
      expect(result.content[0].type).toBe('text');
    });
  });

  describe('delete_collection', () => {
    it('should delete a collection', async () => {
      if (!createCollectionTools) {
        expect(createCollectionTools).toBeDefined();
        return;
      }

      mockOperations.collections.delete.mockResolvedValue(undefined);
      
      createCollectionTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'delete_collection'
      )[3];
      
      const result = await handler({ name: 'posts' });
      
      expect(mockOperations.collections.delete).toHaveBeenCalledWith('posts');
      expect(result.content[0].text).toContain('deleted');
    });
  });
});
