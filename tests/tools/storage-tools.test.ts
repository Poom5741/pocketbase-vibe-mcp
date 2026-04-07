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

describe('Storage Tools', () => {
  let createStorageTools: any;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    server = {
      tool: vi.fn(),
    };
    
    try {
      const module = await import('../../src/tools/storage-tools');
      createStorageTools = module.createStorageTools;
    } catch (error) {
      createStorageTools = undefined;
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Tool Registration', () => {
    it('should export createStorageTools function', () => {
      expect(createStorageTools).toBeDefined();
      expect(typeof createStorageTools).toBe('function');
    });

    it('should register list_files tool', () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      createStorageTools(server, mockOperations);
      
      const listFilesCall = server.tool.mock.calls.find(
        call => call[0] === 'list_files'
      );
      
      expect(listFilesCall).toBeDefined();
      expect(listFilesCall[0]).toBe('list_files');
    });

    it('should register upload_file tool', () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      createStorageTools(server, mockOperations);
      
      const uploadFileCall = server.tool.mock.calls.find(
        call => call[0] === 'upload_file'
      );
      
      expect(uploadFileCall).toBeDefined();
      expect(uploadFileCall[0]).toBe('upload_file');
    });

    it('should register delete_file tool', () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      createStorageTools(server, mockOperations);
      
      const deleteFileCall = server.tool.mock.calls.find(
        call => call[0] === 'delete_file'
      );
      
      expect(deleteFileCall).toBeDefined();
      expect(deleteFileCall[0]).toBe('delete_file');
    });
  });

  describe('list_files', () => {
    it('should list all files in a record', async () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      const mockFiles = [
        { filename: 'avatar.png', size: 1024, mimeType: 'image/png' },
        { filename: 'document.pdf', size: 2048, mimeType: 'application/pdf' },
      ];
      
      mockOperations.files.list.mockResolvedValue(mockFiles);
      
      createStorageTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'list_files'
      )[3];
      
      const result = await handler({ collection: 'users', recordId: '1' });
      
      expect(mockOperations.files.list).toHaveBeenCalledWith('users', '1');
      expect(JSON.parse(result.content[0].text)).toEqual(mockFiles);
    });

    it('should handle record not found', async () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      const error = new Error('Record not found');
      (error as any).status = 404;
      mockOperations.files.list.mockRejectedValue(error);
      
      createStorageTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'list_files'
      )[3];
      
      const result = await handler({ collection: 'users', recordId: 'nonexistent' });
      
      expect(result.isError).toBe(true);
    });
  });

  describe('upload_file', () => {
    it('should upload a file to a record field', async () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      const mockUploadResult = {
        filename: 'avatar.png',
        size: 1024,
        url: 'https://example.com/files/avatar.png',
      };
      
      mockOperations.files.upload.mockResolvedValue(mockUploadResult);
      
      createStorageTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'upload_file'
      )[3];
      
      const result = await handler({
        collection: 'users',
        recordId: '1',
        field: 'avatar',
        file: 'base64encodedfiledata',
      });
      
      expect(mockOperations.files.upload).toHaveBeenCalledWith(
        'users',
        '1',
        'avatar',
        'base64encodedfiledata'
      );
      expect(JSON.parse(result.content[0].text)).toEqual(mockUploadResult);
    });

    it('should fail in read-only mode', async () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      mockOperations.files.upload.mockRejectedValue(
        new Error('Operation blocked in read-only mode')
      );
      
      createStorageTools(server, mockOperations, { readOnly: true });
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'upload_file'
      )[3];
      
      const result = await handler({
        collection: 'users',
        recordId: '1',
        field: 'avatar',
        file: 'filedata',
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read-only mode');
    });
  });

  describe('delete_file', () => {
    it('should delete a file from a record field', async () => {
      if (!createStorageTools) {
        expect(createStorageTools).toBeDefined();
        return;
      }

      mockOperations.files.delete.mockResolvedValue(undefined);
      
      createStorageTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'delete_file'
      )[3];
      
      const result = await handler({
        collection: 'users',
        recordId: '1',
        field: 'avatar',
      });
      
      expect(mockOperations.files.delete).toHaveBeenCalledWith('users', '1', 'avatar');
      expect(result.content[0].text).toContain('deleted');
    });
  });
});
