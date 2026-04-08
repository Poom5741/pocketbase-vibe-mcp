import { Server } from '@modelcontextprotocol/server';
import { createCollectionTools } from './tools/collection-tools';
import { createRecordTools } from './tools/record-tools';
import { createAuthTools } from './tools/auth-tools';
import { createStorageTools } from './tools/storage-tools';
import { createDebugTools } from './tools/debug-tools';
import { createDevelopmentTools } from './tools/development-tools';
import { createCollectionResources } from './resources/collections';
import { SDKPlatform } from './platform/sdk-platform';
import type { Config } from './config';

export function createPocketBaseMCP(config: Config) {
  const server = new Server({
    name: 'pocketbase-mcp',
    version: '1.0.0'
  });

  const operations = new SDKPlatform(config.url, {
    readOnly: config.readOnly
  });

  createCollectionTools(server, operations);
  createRecordTools(server, operations);
  createAuthTools(server, operations);
  createStorageTools(server, operations);
  createDebugTools(server, operations);
  createDevelopmentTools(server, operations);

  createCollectionResources(server, operations);

  return { server, operations };
}
