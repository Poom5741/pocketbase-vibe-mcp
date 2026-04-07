import { z } from 'zod';
import type { PocketBaseOperations } from '../platform/types';

interface ToolOptions {
  readOnly?: boolean;
}

export function createStorageTools(
  server: any,
  operations: PocketBaseOperations,
  options?: ToolOptions
) {
  const isReadOnly = options?.readOnly ?? false;

  // list_files
  server.tool(
    'list_files',
    'List all files in a record',
      z.object({
        collection: z.string().describe('Collection name'),
        recordId: z.string().describe('Record ID')
      }),
      async (params: { collection: string; recordId: string }) => {
        const { collection, recordId } = params;
      try {
        const files = await operations.files.list(collection, recordId);
        return {
          content: [{ type: 'text', text: JSON.stringify(files, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
          isError: true
        };
      }
    }
  );

  // upload_file
  server.tool(
    'upload_file',
    'Upload a file to a record field',
      z.object({
        collection: z.string().describe('Collection name'),
        recordId: z.string().describe('Record ID'),
        field: z.string().describe('File field name'),
        file: z.string().describe('Base64 encoded file data')
      }),
      async (params: { collection: string; recordId: string; field: string; file: string }) => {
        const { collection, recordId, field, file } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        const result = await operations.files.upload(collection, recordId, field, file);
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

  // delete_file
  server.tool(
    'delete_file',
    'Delete a file from a record field',
      z.object({
        collection: z.string().describe('Collection name'),
        recordId: z.string().describe('Record ID'),
        field: z.string().describe('File field name')
      }),
      async (params: { collection: string; recordId: string; field: string }) => {
        const { collection, recordId, field } = params;
      try {
        if (isReadOnly) {
          throw new Error('Operation blocked in read-only mode');
        }
        await operations.files.delete(collection, recordId, field);
        return {
          content: [{ type: 'text', text: `File deleted successfully from field '${field}'` }]
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
