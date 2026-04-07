import { z } from 'zod';
import type { PocketBaseOperations } from '../platform/types';

interface ToolOptions {
  readOnly?: boolean;
}

export function createAuthTools(
  server: any,
  operations: PocketBaseOperations,
  options?: ToolOptions
) {
  const isReadOnly = options?.readOnly ?? false;

  // list_users
  server.tool(
    'list_users',
    'List all users with pagination and filtering',
    z.object({
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(50),
      filter: z.string().optional(),
      sort: z.string().optional()
    }),
    async (params: { page?: number; perPage?: number; filter?: string; sort?: string }) => {
      const { page, perPage, filter, sort } = params;
      try {
        const result = await operations.users.list({
          page,
          perPage,
          filter,
          sort
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
          isError: true
        };
      }
    }
  );

  // get_user
  server.tool(
    'get_user',
    'Get a single user by ID',
    z.object({
      id: z.string().describe('User ID')
    }),
    async (params: { id: string }) => {
      const { id } = params;
      try {
        const result = await operations.users.get(id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
          isError: true
        };
      }
    }
  );

  // create_user
  server.tool(
    'create_user',
    'Create a new user',
    z.object({
      data: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        passwordConfirm: z.string().optional(),
        username: z.string().optional(),
        name: z.string().optional()
      })
    }),
    async (params: { data: { email: string; password: string; passwordConfirm?: string; username?: string; name?: string } }) => {
      const { data } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        const result = await operations.users.create(data);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('read-only mode')) {
          return {
            content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            isError: true
          };
        }
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true
        };
      }
    }
  );

  // update_user
  server.tool(
    'update_user',
    'Update an existing user',
    z.object({
      id: z.string().describe('User ID'),
      data: z.record(z.any()).describe('User data to update')
    }),
    async (params: { id: string; data: Record<string, any> }) => {
      const { id, data } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        const result = await operations.users.update(id, data);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('read-only mode')) {
          return {
            content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            isError: true
          };
        }
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true
        };
      }
    }
  );

  // delete_user
  server.tool(
    'delete_user',
    'Delete a user',
    z.object({
      id: z.string().describe('User ID')
    }),
    async (params: { id: string }) => {
      const { id } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        await operations.users.delete(id);
        return {
          content: [{ type: 'text', text: `User '${id}' deleted successfully` }]
        };
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('read-only mode')) {
          return {
            content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            isError: true
          };
        }
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true
        };
      }
    }
  );
}
