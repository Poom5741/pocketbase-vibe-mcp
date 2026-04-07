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

describe('Auth Tools', () => {
  let createAuthTools: any;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    server = {
      tool: vi.fn(),
    };
    
    try {
      const module = await import('../../src/tools/auth-tools');
      createAuthTools = module.createAuthTools;
    } catch (error) {
      createAuthTools = undefined;
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Tool Registration', () => {
    it('should export createAuthTools function', () => {
      expect(createAuthTools).toBeDefined();
      expect(typeof createAuthTools).toBe('function');
    });

    it('should register list_users tool', () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      createAuthTools(server, mockOperations);
      
      const listUsersCall = server.tool.mock.calls.find(
        call => call[0] === 'list_users'
      );
      
      expect(listUsersCall).toBeDefined();
      expect(listUsersCall[0]).toBe('list_users');
    });

    it('should register get_user tool', () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      createAuthTools(server, mockOperations);
      
      const getUserCall = server.tool.mock.calls.find(
        call => call[0] === 'get_user'
      );
      
      expect(getUserCall).toBeDefined();
      expect(getUserCall[0]).toBe('get_user');
    });

    it('should register create_user tool', () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      createAuthTools(server, mockOperations);
      
      const createUserCall = server.tool.mock.calls.find(
        call => call[0] === 'create_user'
      );
      
      expect(createUserCall).toBeDefined();
      expect(createUserCall[0]).toBe('create_user');
    });

    it('should register update_user tool', () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      createAuthTools(server, mockOperations);
      
      const updateUserCall = server.tool.mock.calls.find(
        call => call[0] === 'update_user'
      );
      
      expect(updateUserCall).toBeDefined();
      expect(updateUserCall[0]).toBe('update_user');
    });

    it('should register delete_user tool', () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      createAuthTools(server, mockOperations);
      
      const deleteUserCall = server.tool.mock.calls.find(
        call => call[0] === 'delete_user'
      );
      
      expect(deleteUserCall).toBeDefined();
      expect(deleteUserCall[0]).toBe('delete_user');
    });
  });

  describe('list_users', () => {
    it('should list all users with pagination', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      const mockUsers = {
        items: [
          { id: '1', email: 'user1@example.com' },
          { id: '2', email: 'user2@example.com' },
        ],
        page: 1,
        perPage: 50,
        totalItems: 2,
        totalPages: 1,
      };
      
      mockOperations.users.list.mockResolvedValue(mockUsers);
      
      createAuthTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'list_users'
      )[3];
      
      const result = await handler({ page: 1, perPage: 50 });
      
      expect(mockOperations.users.list).toHaveBeenCalledWith({ page: 1, perPage: 50 });
      expect(JSON.parse(result.content[0].text)).toEqual(mockUsers);
    });

    it('should list users with filter', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      const mockUsers = {
        items: [{ id: '1', email: 'admin@example.com' }],
        page: 1,
        perPage: 50,
        totalItems: 1,
        totalPages: 1,
      };
      
      mockOperations.users.list.mockResolvedValue(mockUsers);
      
      createAuthTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'list_users'
      )[3];
      
      const result = await handler({ filter: 'email:admin@example.com' });
      
      expect(mockOperations.users.list).toHaveBeenCalledWith({
        filter: 'email:admin@example.com',
      });
    });
  });

  describe('get_user', () => {
    it('should return a single user by ID', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      const mockUser = { id: '1', email: 'user@example.com' };
      mockOperations.users.get.mockResolvedValue(mockUser);
      
      createAuthTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_user'
      )[3];
      
      const result = await handler({ id: '1' });
      
      expect(mockOperations.users.get).toHaveBeenCalledWith('1');
      expect(JSON.parse(result.content[0].text)).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      const error = new Error('User not found');
      (error as any).status = 404;
      mockOperations.users.get.mockRejectedValue(error);
      
      createAuthTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'get_user'
      )[3];
      
      const result = await handler({ id: 'nonexistent' });
      
      expect(result.isError).toBe(true);
    });
  });

  describe('create_user', () => {
    it('should create a new user', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      const userData = { email: 'newuser@example.com', password: 'securepass123' };
      const mockCreated = { id: '3', ...userData };
      mockOperations.users.create.mockResolvedValue(mockCreated);
      
      createAuthTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'create_user'
      )[3];
      
      const result = await handler({ data: userData });
      
      expect(mockOperations.users.create).toHaveBeenCalledWith(userData);
      expect(JSON.parse(result.content[0].text)).toEqual(mockCreated);
    });

    it('should fail in read-only mode', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      mockOperations.users.create.mockRejectedValue(
        new Error('Operation blocked in read-only mode')
      );
      
      createAuthTools(server, mockOperations, { readOnly: true });
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'create_user'
      )[3];
      
      const result = await handler({ data: { email: 'test@example.com', password: 'pass' } });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read-only mode');
    });
  });

  describe('update_user', () => {
    it('should update an existing user', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      const updates = { email: 'updated@example.com' };
      const mockUpdated = { id: '1', ...updates };
      mockOperations.users.update.mockResolvedValue(mockUpdated);
      
      createAuthTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'update_user'
      )[3];
      
      const result = await handler({ id: '1', data: updates });
      
      expect(mockOperations.users.update).toHaveBeenCalledWith('1', updates);
    });
  });

  describe('delete_user', () => {
    it('should delete a user', async () => {
      if (!createAuthTools) {
        expect(createAuthTools).toBeDefined();
        return;
      }

      mockOperations.users.delete.mockResolvedValue(undefined);
      
      createAuthTools(server, mockOperations);
      
      const handler = server.tool.mock.calls.find(
        call => call[0] === 'delete_user'
      )[3];
      
      const result = await handler({ id: '1' });
      
      expect(mockOperations.users.delete).toHaveBeenCalledWith('1');
      expect(result.content[0].text).toContain('deleted');
    });
  });
});
