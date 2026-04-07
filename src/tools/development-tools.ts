import { z } from 'zod';
import type { PocketBaseOperations } from '../platform/types';

export function createDevelopmentTools(
  server: any,
  operations: PocketBaseOperations
) {
  // generate_typescript_types
  server.tool(
    'generate_typescript_types',
    'Generate TypeScript types from collection schemas',
    z.object({}),
    async () => {
      try {
        const result = await operations.development.generateTypeScriptTypes();
        return {
          content: [{ type: 'text', text: result }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
          isError: true
        };
      }
    }
  );

  // get_api_url
  server.tool(
    'get_api_url',
    'Get the API base URL',
    z.object({}),
    async () => {
      try {
        const result = await operations.development.getApiUrl();
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
          isError: true
        };
      }
    }
  );

  // get_health_status
  server.tool(
    'get_health_status',
    'Get instance health status',
    z.object({}),
    async () => {
      try {
        const result = await operations.development.getHealthStatus();
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
}
