import { z } from 'zod';
import type { PocketBaseOperations } from '../platform/types';

interface ToolOptions {
  readOnly?: boolean;
}

export function createRecordTools(
  server: any,
  operations: PocketBaseOperations,
  options?: ToolOptions
) {
  const isReadOnly = options?.readOnly ?? false;

  // query_collection
  server.tool(
    'query_collection',
    'Query records from a collection with pagination and filtering',
    z.object({
      collection: z.string().describe('Collection name'),
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(50),
      filter: z.string().optional(),
      sort: z.string().optional()
    }),
    async (params: {
      collection: string;
      page?: number;
      perPage?: number;
      filter?: string;
      sort?: string;
    }) => {
      const { collection, page, perPage, filter, sort } = params;
      try {
        const result = await operations.records.query(collection, {
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

  // get_record
  server.tool(
    'get_record',
    'Get a single record by ID',
    z.object({
      collection: z.string().describe('Collection name'),
      id: z.string().describe('Record ID')
    }),
    async (params: { collection: string; id: string }) => {
      const { collection, id } = params;
      try {
        const result = await operations.records.get(collection, id);
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

  // create_record
  server.tool(
    'create_record',
    'Create a new record in a collection',
      z.object({
        collection: z.string().describe('Collection name'),
        data: z.record(z.any()).describe('Record data')
      }),
      async (params: { collection: string; data: Record<string, any> }) => {
        const { collection, data } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        const result = await operations.records.create(collection, data);
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

  // update_record
  server.tool(
    'update_record',
    'Update an existing record',
      z.object({
        collection: z.string().describe('Collection name'),
        id: z.string().describe('Record ID'),
        data: z.record(z.any()).describe('Record data to update')
      }),
      async (params: { collection: string; id: string; data: Record<string, any> }) => {
        const { collection, id, data } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        const result = await operations.records.update(collection, id, data);
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

  // delete_record
  server.tool(
    'delete_record',
    'Delete a record from a collection',
    z.object({
      collection: z.string().describe('Collection name'),
      id: z.string().describe('Record ID')
    }),
    async (params: { collection: string; id: string }) => {
      const { collection, id } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        await operations.records.delete(collection, id);
        return {
          content: [{ type: 'text', text: `Record '${id}' deleted successfully` }]
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
