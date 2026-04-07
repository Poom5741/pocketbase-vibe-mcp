import { z } from 'zod';
import type { PocketBaseOperations, CollectionSchema } from '../platform/types';

interface ToolOptions {
  readOnly?: boolean;
}

export function createCollectionTools(
  server: any,
  operations: PocketBaseOperations,
  options?: ToolOptions
) {
  const isReadOnly = options?.readOnly ?? false;

  // list_collections
  server.tool(
    'list_collections',
    'List all collection schemas',
    z.object({}),
    async () => {
      try {
        const result = await operations.collections.list();
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

  // get_collection
  server.tool(
    'get_collection',
    'Get a single collection schema by name',
    z.object({
      name: z.string().describe('Collection name')
    }),
    async (params: { name: string }) => {
      const { name } = params;
      try {
        const result = await operations.collections.get(name);
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

  // create_collection
  server.tool(
    'create_collection',
    'Create a new collection schema',
    z.object({
      schema: z.object({
        name: z.string(),
        type: z.enum(['base', 'auth', 'view']),
        schema: z.array(z.object({
          name: z.string(),
          type: z.string(),
          required: z.boolean(),
          unique: z.boolean(),
          options: z.record(z.any()).optional()
        })).optional(),
        listRule: z.string().optional(),
        viewRule: z.string().optional(),
        createRule: z.string().optional(),
        updateRule: z.string().optional(),
        deleteRule: z.string().optional()
      })
    }),
    async (params: { schema: { name: string; type: 'base' | 'auth' | 'view'; schema?: any[]; listRule?: string; viewRule?: string; createRule?: string; updateRule?: string; deleteRule?: string } }) => {
      const { schema } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        const result = await operations.collections.create(schema);
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

  // update_collection
  server.tool(
    'update_collection',
    'Update an existing collection schema',
    z.object({
      name: z.string().describe('Collection name'),
      schema: z.object({
        name: z.string().optional(),
        type: z.enum(['base', 'auth', 'view']).optional(),
        schema: z.array(z.object({
          name: z.string(),
          type: z.string(),
          required: z.boolean(),
          unique: z.boolean(),
          options: z.record(z.any()).optional()
        })).optional(),
        listRule: z.string().optional(),
        viewRule: z.string().optional(),
        createRule: z.string().optional(),
        updateRule: z.string().optional(),
        deleteRule: z.string().optional()
      })
    }),
    async (params: { name: string; schema: { name?: string; type?: 'base' | 'auth' | 'view'; schema?: any[]; listRule?: string; viewRule?: string; createRule?: string; updateRule?: string; deleteRule?: string } }) => {
      const { name, schema } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        const result = await operations.collections.update(name, schema as CollectionSchema);
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

  // delete_collection
  server.tool(
    'delete_collection',
    'Delete a collection schema',
    z.object({
      name: z.string().describe('Collection name')
    }),
    async (params: { name: string }) => {
      const { name } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        await operations.collections.delete(name);
        return {
          content: [{ type: 'text', text: `Collection '${name}' deleted successfully` }]
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
