import { z } from 'zod';
import type { PocketBaseOperations } from '../platform/types';

export function createDebugTools(
  server: any,
  operations: PocketBaseOperations
) {
  // get_logs
  server.tool(
    'get_logs',
    'Get instance logs for debugging',
    z.object({
      limit: z.number().optional().default(50).describe('Maximum number of logs to return')
    }),
    async (params: { limit?: number }) => {
      const { limit } = params;
      try {
        const result = await operations.debugging.getLogs({ limit });
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
