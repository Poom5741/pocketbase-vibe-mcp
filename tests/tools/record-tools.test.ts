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

describe('Record Tools', () => {
  let createRecordTools: any;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    server = {
      tool: vi.fn(),
    };
    
    try {
      const module = await import('../../src/tools/record-tools');
      createRecordTools = module.createRecordTools;
    } catch (error) {
      createRecordTools = undefined;
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Tool Registration', () => {
    it('should export createRecordTools function', () => {
      expect(createRecordTools).toBeDefined();
      expect(typeof createRecordTools).toBe('function');
    });

    it('should register query_collection tool', () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      createRecordTools(server, mockOperations);
      
      const queryCollectionCall = server.tool.mock.calls.find(
        call => call[0] === 'query_collection'
      );
      
      expect(queryCollectionCall).toBeDefined();
      expect(queryCollectionCall[0]).toBe('query_collection');
    });

    it('should register get_record tool', () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      createRecordTools(server, mockOperations);
      
      const getRecordCall = server.tool.mock.calls.find(
        call => call[0] === 'get_record'
      );
      
      expect(getRecordCall).toBeDefined();
      expect(getRecordCall[0]).toBe('get_record');
    });

    it('should register create_record tool', () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      createRecordTools(server, mockOperations);
      
      const createRecordCall = server.tool.mock.calls.find(
        call => call[0] === 'create_record'
      );
      
      expect(createRecordCall).toBeDefined();
      expect(createRecordCall[0]).toBe('create_record');
    });

    it('should register update_record tool', () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      createRecordTools(server, mockOperations);
      
      const updateRecordCall = server.tool.mock.calls.find(
        call => call[0] === 'update_record'
      );
      
      expect(updateRecordCall).toBeDefined();
      expect(updateRecordCall[0]).toBe('update_record');
    });

    it('should register delete_record tool', () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      createRecordTools(server, mockOperations);
      
      const deleteRecordCall = server.tool.mock.calls.find(
        call => call[0] === 'delete_record'
      );
      
      expect(deleteRecordCall).toBeDefined();
      expect(deleteRecordCall[0]).toBe('delete_record');
    });
  });

  describe('query_collection', () => {
    it('should query records with pagination', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      const mockRecords = {
        items: [{ id: '1', title: 'Post 1' }, { id: '2', title: 'Post 2' }],
        page: 1,
        perPage: 50,
        totalItems: 2,
        totalPages: 1,
      };
      
      mockOperations.records.query.mockResolvedValue(mockRecords);
      
      createRecordTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'query_collection'
      )[3];
      
      const result = await handler({ 
        collection: 'posts',
        page: 1,
        perPage: 50 
      });
      
      expect(mockOperations.records.query).toHaveBeenCalledWith('posts', {
        page: 1,
        perPage: 50,
      });
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockRecords);
    });

    it('should query records with filter', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      const mockRecords = {
        items: [{ id: '1', title: 'Published Post' }],
        page: 1,
        perPage: 50,
        totalItems: 1,
        totalPages: 1,
      };
      
      mockOperations.records.query.mockResolvedValue(mockRecords);
      
      createRecordTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'query_collection'
      )[3];
      
      const result = await handler({ 
        collection: 'posts',
        filter: 'published = true'
      });
      
      expect(mockOperations.records.query).toHaveBeenCalledWith('posts', {
        filter: 'published = true',
      });
    });
  });

  describe('get_record', () => {
    it('should return a single record by ID', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      const mockRecord = { id: '1', title: 'Post 1', content: 'Content' };
      mockOperations.records.get.mockResolvedValue(mockRecord);
      
      createRecordTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_record'
      )[3];
      
      const result = await handler({ collection: 'posts', id: '1' });
      
      expect(mockOperations.records.get).toHaveBeenCalledWith('posts', '1');
      expect(JSON.parse(result.content[0].text)).toEqual(mockRecord);
    });

    it('should handle record not found', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      const error = new Error('Record not found');
      (error as any).status = 404;
      mockOperations.records.get.mockRejectedValue(error);
      
      createRecordTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_record'
      )[3];
      
      const result = await handler({ collection: 'posts', id: 'nonexistent' });
      
      expect(result.isError).toBe(true);
    });
  });

  describe('create_record', () => {
    it('should create a new record', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      const data = { title: 'New Post', content: 'Content' };
      const mockCreated = { id: '3', ...data };
      mockOperations.records.create.mockResolvedValue(mockCreated);
      
      createRecordTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'create_record'
      )[3];
      
      const result = await handler({ collection: 'posts', data });
      
      expect(mockOperations.records.create).toHaveBeenCalledWith('posts', data);
      expect(JSON.parse(result.content[0].text)).toEqual(mockCreated);
    });

    it('should fail in read-only mode', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      mockOperations.records.create.mockRejectedValue(
        new Error('Operation blocked in read-only mode')
      );
      
      createRecordTools(server, mockOperations, { readOnly: true });
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'create_record'
      )[3];
      
      const result = await handler({ collection: 'posts', data: { title: 'Test' } });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read-only mode');
    });
  });

  describe('update_record', () => {
    it('should update an existing record', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      const data = { title: 'Updated Post' };
      const mockUpdated = { id: '1', ...data };
      mockOperations.records.update.mockResolvedValue(mockUpdated);
      
      createRecordTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'update_record'
      )[3];
      
      const result = await handler({ collection: 'posts', id: '1', data });
      
      expect(mockOperations.records.update).toHaveBeenCalledWith('posts', '1', data);
    });
  });

  describe('delete_record', () => {
    it('should delete a record', async () => {
      if (!createRecordTools) {
        expect(createRecordTools).toBeDefined();
        return;
      }

      mockOperations.records.delete.mockResolvedValue(undefined);
      
      createRecordTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'delete_record'
      )[3];
      
      const result = await handler({ collection: 'posts', id: '1' });
      
      expect(mockOperations.records.delete).toHaveBeenCalledWith('posts', '1');
      expect(result.content[0].text).toContain('deleted');
    });
  });
});
