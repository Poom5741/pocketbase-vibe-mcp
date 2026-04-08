/**
 * PocketBase MCP Server
 * 
 * This is the main entry point for the PocketBase Model Context Protocol Server.
 */

import { loadConfig } from './config';
import { createPocketBaseMCP } from './server';
import { StdioServerTransport } from '@modelcontextprotocol/server';

async function main() {
  const config = loadConfig();
  const { server } = createPocketBaseMCP(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);