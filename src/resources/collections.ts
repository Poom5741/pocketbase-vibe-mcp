import type { PocketBaseOperations } from '../platform/types';

export function createCollectionResources(
  server: any,
  operations: PocketBaseOperations
) {
  server.resource(
    'collections',
    'collections://*',
    async (uri: URL) => {
      try {
        const collectionName = uri.pathname.slice(1);
        
        if (!collectionName) {
          const collections = await operations.collections.list();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(collections, null, 2),
              mimeType: 'application/json'
            }]
          };
        } else {
          const collection = await operations.collections.get(collectionName);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(collection, null, 2),
              mimeType: 'application/json'
            }]
          };
        }
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error: ${(error as Error).message}`,
            isError: true
          }]
        };
      }
    }
  );
}
