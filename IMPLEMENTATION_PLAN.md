# PocketBase Vibe MCP - Implementation Plan

**Project**: PocketBase Vibe MCP Server  
**Target**: Feature parity with Supabase MCP  
**Timeline**: 4-5 days (29-35 hours)  
**Unique Features**: Read-only mode, Supabase MCP parity, clean architecture

---

## Quick Start

### Prerequisites
- Node.js >= 20
- TypeScript >= 5.0
- PocketBase instance (local or remote)

### Installation
```bash
git clone https://github.com/Poom5741/pocketbase-vibe-mcp.git
cd pocketbase-vibe-mcp
npm install
npm run build
```

### Configuration
```bash
# CLI args
./dist/index.js \
  --url http://localhost:8090 \
  --admin-token $PB_ADMIN_TOKEN \
  --read-only

# Environment variables
export POCKETBASE_URL=http://localhost:8090
export POCKETBASE_ADMIN_TOKEN=your-token
export POCKETBASE_READONLY=true

# Config file (~/.pocketbase-vibe-mcp.json)
pocketbase-mcp --config ~/.pocketbase-vibe-mcp.json
```

### Claude Code Integration
Add to `claude.json`:
```json
{
  "mcpServers": {
    "pocketbase": {
      "command": "node",
      "args": ["/path/to/pocketbase-vibe-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://localhost:8090",
        "POCKETBASE_ADMIN_TOKEN": "your-token",
        "POCKETBASE_READONLY": "true"
      }
    }
  }
}
```

---

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                      CLI Entry Point                            │
│                       (src/index.ts)                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  createPocketBaseMCP(config)                    │
│                     (src/server.ts)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Options: platform, readOnly, features                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              new McpServer(@modelcontextprotocol/server)        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ - name: 'pocketbase-vibe-mcp'                             │   │
│  │ - version: 1.0.0                                         │   │
│  │ - tools: async function returning Record<string, Tool>  │   │
│  │ - resources: collection schemas                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Collections   │  │   Records      │  │   Users        │
│   Operations    │  │   Operations    │  │   Operations    │
│                 │  │                 │  │                 │
│ - list         │  │ - query        │  │ - list         │
│ - get          │  │ - get          │  │ - get          │
│ - create       │  │ - create       │  │ - create       │
│ - update       │  │ - update       │  │ - update       │
│ - delete       │  │ - delete       │  │ - delete       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PocketBasePlatform Interface                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ interface PocketBasePlatform {                           │   │
│  │   collections: CollectionOperations;                    │   │
│  │   records: RecordOperations;                            │   │
│  │   users: UserOperations;                                 │   │
│  │   files: FileOperations;                                 │   │
│  │   debugging: DebugOperations;                           │   │
│  │   development: DevelopmentOperations;                   │   │
│  │ }                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         createPocketBaseSDKPlatform(config)                     │
│         (src/platform/sdk-platform.ts)                           │
│  - Creates PocketBase JS SDK client                             │
│  - Authenticates with admin token                               │
│  - Returns platform object with all operations                  │
│  - Enforces read-only at operation level                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
pocketbase-vibe-mcp/
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── server.ts                 # MCP server creation
│   ├── config.ts                 # Configuration loading
│   ├── types.ts                  # Type definitions
│   ├── errors.ts                 # Error wrapper
│   ├── platform/
│   │   ├── types.ts              # PocketBasePlatform interface
│   │   └── sdk-platform.ts       # SDK implementation
│   ├── tools/
│   │   ├── collection-tools.ts   # Database tools (5 tools)
│   │   ├── record-tools.ts       # Records CRUD (5 tools)
│   │   ├── auth-tools.ts         # User management (5 tools)
│   │   ├── storage-tools.ts      # File operations (3 tools)
│   │   ├── debug-tools.ts        # Logs (1 tool)
│   │   └── development-tools.ts  # TypeScript generation (3 tools)
│   └── resources/
│       └── collections.ts        # Collection schema resources
├── tests/
│   ├── platform/
│   │   ├── operations.test.ts
│   │   └── readonly.test.ts
│   ├── tools/
│   │   ├── collections.test.ts
│   │   └── error-handling.test.ts
│   └── integration/
│       ├── crud.test.ts
│       └── readonly.test.ts
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── ARCHITECTURE.md
├── PLAN.md
├── RESEARCH.md
├── TOOL_SPEC.md
└── IMPLEMENTATION_PLAN.md  (this file)
```

---

## Dependencies

```json
{
  "name": "pocketbase-vibe-mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "pocketbase-vibe-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/"
  },
  "dependencies": {
    "pocketbase": "^0.21.0",
    "@modelcontextprotocol/server": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

---

## Tool Inventory (22 Tools)

### Tool Group 1: Database/Collections (5 tools)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `list_collections` | ✅ | List all collection schemas |
| `get_collection` | ✅ | Get single collection schema |
| `create_collection` | ❌ | Create new collection |
| `update_collection` | ❌ | Update collection schema |
| `delete_collection` | ❌ | Delete collection |

**Supabase Parity**: `list_tables` → `list_collections`

---

### Tool Group 2: Records (5 tools)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `query_collection` | ✅ | Query with filters, sort, pagination |
| `get_record` | ✅ | Get single record by ID |
| `create_record` | ❌ | Create new record |
| `update_record` | ❌ | Update record |
| `delete_record` | ❌ | Delete record |

**Supabase Parity**: `execute_sql(SELECT)` → `query_collection`

---

### Tool Group 3: Auth/Users (5 tools)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `list_users` | ✅ | List user accounts |
| `get_user` | ✅ | Get single user |
| `create_user` | ❌ | Create user account |
| `update_user` | ❌ | Update user |
| `delete_user` | ❌ | Delete user |

**Supabase Parity**: Auth management

---

### Tool Group 4: Storage/Files (3 tools)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `list_files` | ✅ | List files on record |
| `upload_file` | ❌ | Upload file to record |
| `delete_file` | ❌ | Delete file from record |

**Supabase Parity**: `list_storage_buckets`

---

### Tool Group 5: Debugging (1 tool)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `get_logs` | ✅ | Get instance logs |

**Supabase Parity**: `get_logs`

---

### Tool Group 6: Development (3 tools)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `generate_typescript_types` | ✅ | Generate TS type definitions |
| `get_api_url` | ✅ | Get API base URL |
| `get_health_status` | ✅ | Check instance health |

**Supabase Parity**: `generate_typescript_types`

---

## Implementation Phases

### Phase 1: Project Setup (2-3 hours)

**Tasks**:
1. Initialize npm project
2. Install dependencies
3. Configure TypeScript
4. Create directory structure
5. Setup package.json scripts

**Commands**:
```bash
npm init -y
npm install pocketbase @modelcontextprotocol/server zod
npm install -D typescript vitest @types/node tsx
npx tsc --init
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Verification**: `npm run build` compiles without errors

---

### Phase 2: Configuration Layer (2 hours)

**File**: `src/config.ts`

**Implementation**:
```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface Config {
  url: string;
  adminToken: string;
  readOnly: boolean;
}

function parseArgs(): Partial<Config> {
  const args = process.argv.slice(2);
  const config: Partial<Config> = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        config.url = args[++i];
        break;
      case '--admin-token':
        config.adminToken = args[++i];
        break;
      case '--read-only':
        config.readOnly = true;
        break;
      case '--config':
        Object.assign(config, loadConfigFile(args[++i]));
        break;
    }
  }
  
  return config;
}

function loadConfigFile(configPath: string): Config {
  const resolved = path.resolve(configPath.replace(/^~/, process.env.HOME || ''));
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

function loadFromEnv(): Partial<Config> {
  return {
    url: process.env.POCKETBASE_URL,
    adminToken: process.env.POCKETBASE_ADMIN_TOKEN,
    readOnly: process.env.POCKETBASE_READONLY === 'true',
  };
}

export function loadConfig(): Config {
  const cli = parseArgs();
  const env = loadFromEnv();
  
  // Priority: CLI > env > config file
  const config = {
    url: cli.url || env.url,
    adminToken: cli.adminToken || env.adminToken,
    readOnly: cli.readOnly ?? env.readOnly ?? false,
  };
  
  validateConfig(config);
  return config;
}

function validateConfig(config: Config) {
  if (!config.url) {
    throw new Error('Missing required configuration: POCKETBASE_URL or --url');
  }
  if (!config.adminToken) {
    throw new Error('Missing required configuration: POCKETBASE_ADMIN_TOKEN or --admin-token');
  }
  try {
    new URL(config.url);
  } catch {
    throw new Error(`Invalid URL: ${config.url}`);
  }
}
```

**Tests**: Priority resolution, validation errors, config file parsing

---

### Phase 3: Platform Abstraction (4-5 hours)

**File**: `src/platform/types.ts`

```typescript
import type { ListResult } from 'pocketbase';

export interface Collection {
  id: string;
  name: string;
  type: 'base' | 'auth' | 'view';
  schema: Array<{
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    options?: Record<string, any>;
  }>;
  listRule?: string | null;
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
}

export type CollectionOperations = {
  list(): Promise<Collection[]>;
  get(name: string): Promise<Collection>;
  create(schema: CollectionSchema): Promise<Collection>;
  update(name: string, schema: Partial<CollectionSchema>): Promise<Collection>;
  delete(name: string): Promise<void>;
};

export type RecordOperations = {
  query(collection: string, options: QueryOptions): Promise<ListResult<any>>;
  get(collection: string, id: string): Promise<any>;
  create(collection: string, data: Record<string, any>): Promise<any>;
  update(collection: string, id: string, data: Record<string, any>): Promise<any>;
  delete(collection: string, id: string): Promise<void>;
};

export type UserOperations = {
  list(options?: QueryOptions): Promise<ListResult<any>>;
  get(id: string): Promise<any>;
  create(data: UserData): Promise<any>;
  update(id: string, data: Partial<UserData>): Promise<any>;
  delete(id: string): Promise<void>;
};

export type FileOperations = {
  list(collection: string, recordId: string, field: string): Promise<string[]>;
  upload(collection: string, recordId: string, field: string, file: File): Promise<string>;
  delete(collection: string, recordId: string, field: string, fileName: string): Promise<void>;
};

export type DebugOperations = {
  getLogs(options?: LogOptions): Promise<LogEntry[]>;
};

export type DevelopmentOperations = {
  generateTypeScriptTypes(): Promise<string>;
  getApiUrl(): string;
  getHealthStatus(): Promise<HealthStatus>;
};

export interface PocketBasePlatform {
  collections: CollectionOperations;
  records: RecordOperations;
  users: UserOperations;
  files: FileOperations;
  debugging: DebugOperations;
  development: DevelopmentOperations;
}
```

**File**: `src/platform/sdk-platform.ts`

```typescript
import PocketBase, { ClientResponseError } from 'pocketbase';
import type { Config } from '../config.js';
import type { PocketBasePlatform, Collection, CollectionSchema } from './types.js';

export class ReadOnlyError extends Error {
  constructor(operation: string) {
    super(`Operation '${operation}' is blocked in read-only mode. Use the PocketBase dashboard (${dashboardUrl}) to make changes.`);
    this.name = 'ReadOnlyError';
  }
}

export function createPocketBaseSDKPlatform(config: Config): PocketBasePlatform {
  const pb = new PocketBase(config.url);
  
  // Authenticate as admin
  try {
    pb.authStore.save(config.adminToken, { collectionId: '_superusers' });
  } catch (error) {
    throw new Error(`Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const assertWritable = (operation: string) => {
    if (config.readOnly) {
      throw new ReadOnlyError(operation);
    }
  };

  return {
    collections: {
      async list() {
        return await pb.collections.getFullList<Collection>();
      },
      async get(name: string) {
        return await pb.collections.getOne<Collection>(name);
      },
      async create(schema: CollectionSchema) {
        assertWritable('create_collection');
        return await pb.collections.create<Collection>(schema);
      },
      async update(name: string, schema: Partial<CollectionSchema>) {
        assertWritable('update_collection');
        return await pb.collections.update<Collection>(name, schema);
      },
      async delete(name: string) {
        assertWritable('delete_collection');
        await pb.collections.delete(name);
      },
    },

    records: {
      async query(collection: string, options) {
        const { page = 1, perPage = 100, filter = '', sort = '-created' } = options;
        return await pb.collection(collection).getList(page, perPage, { filter, sort });
      },
      async get(collection: string, id: string) {
        return await pb.collection(collection).getOne(id);
      },
      async create(collection: string, data: Record<string, any>) {
        assertWritable('create_record');
        return await pb.collection(collection).create(data);
      },
      async update(collection: string, id: string, data: Record<string, any>) {
        assertWritable('update_record');
        return await pb.collection(collection).update(id, data);
      },
      async delete(collection: string, id: string) {
        assertWritable('delete_record');
        await pb.collection(collection).delete(id);
      },
    },

    users: {
      async list(options = {}) {
        const { page = 1, perPage = 100, filter = '', sort = '-created' } = options;
        return await pb.collection('users').getList(page, perPage, { filter, sort });
      },
      async get(id: string) {
        return await pb.collection('users').getOne(id);
      },
      async create(data: any) {
        assertWritable('create_user');
        if (!data.passwordConfirm) {
          data.passwordConfirm = data.password;
        }
        return await pb.collection('users').create(data);
      },
      async update(id: string, data: any) {
        assertWritable('update_user');
        return await pb.collection('users').update(id, data);
      },
      async delete(id: string) {
        assertWritable('delete_user');
        await pb.collection('users').delete(id);
      },
    },

    files: {
      async list(collection: string, recordId: string, field: string) {
        const record = await pb.collection(collection).getOne(recordId);
        const files = record[field];
        return Array.isArray(files) ? files : files ? [files] : [];
      },
      async upload(collection: string, recordId: string, field: string, file: File) {
        assertWritable('upload_file');
        const formData = new FormData();
        formData.set(field, file);
        return await pb.collection(collection).update(recordId, formData);
      },
      async delete(collection: string, recordId: string, field: string, fileName: string) {
        assertWritable('delete_file');
        await pb.collection(collection).update(recordId, { [field]: null });
      },
    },

    debugging: {
      async getLogs(options = {}) {
        const { level = 'all', limit = 50 } = options;
        // Use raw send for logs endpoint
        const response = await pb.send('/api/logs', {
          query: { level, limit },
        });
        return response.logs || [];
      },
    },

    development: {
      async generateTypeScriptTypes() {
        const collections = await pb.collections.getFullList();
        const types = collections.map((c) => {
          const fields = c.schema
            .map((f: any) => `  ${f.name}: ${mapType(f.type)};`)
            .join('\n');
          return `export interface ${capitalize(c.name)} {\n  id: string;\n  created: string;\n  updated: string;\n${fields}\n}`;
        });
        return types.join('\n\n');
      },
      getApiUrl() {
        return pb.baseUrl;
      },
      async getHealthStatus() {
        const health = await pb.send('/api/health');
        return {
          healthy: !health.error,
          version: health.version || 'unknown',
          uptime: health.uptime || 0,
        };
      },
    },
  };
}

// Helper functions
function mapType(pbType: string): string {
  const typeMap: Record<string, string> = {
    text: 'string',
    number: 'number',
    bool: 'boolean',
    email: 'string',
    url: 'string',
    date: 'string',
    select: 'string',
    json: 'Record<string, any>',
    relation: 'string | Record<string, any>',
    file: 'string | string[]',
  };
  return typeMap[pbType] || 'any';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

**Error Wrapper**: `src/errors.ts`
```typescript
import { ClientResponseError } from 'pocketbase';

export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
  
  static fromPocketBase(error: unknown, operation: string): MCPError {
    if (error instanceof ClientResponseError) {
      return new MCPError(
        `PB_${error.status}`,
        `Failed to ${operation}: ${error.message}`,
        error.response?.data
      );
    }
    return new MCPError(
      'UNKNOWN_ERROR',
      `Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

---

### Phase 4: Tool Implementations (8-10 hours)

**Pattern for all tool files**:
```typescript
// src/tools/collection-tools.ts
import * as z from 'zod/v4';
import type { PocketBasePlatform } from '../platform/types.js';
import type { CallToolResult } from '@modelcontextprotocol/server';

interface ToolDef {
  description: string;
  inputSchema: z.ZodType;
  outputSchema?: z.ZodType;
  annotations: {
    title: string;
    readOnlyHint: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

export const collectionToolDefs: Record<string, ToolDef> = {
  list_collections: {
    description: 'List all collection schemas in the PocketBase instance',
    inputSchema: z.object({
      expand: z.boolean().optional().default(false).describe('Include additional metadata'),
    }),
    annotations: {
      title: 'List Collections',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  // ... other tool definitions
};

export function getCollectionTools(
  platform: PocketBasePlatform,
  readOnly: boolean
): Record<string, any> {
  return {
    list_collections: {
      ...collectionToolDefs.list_collections,
      execute: async (args: any): Promise<CallToolResult> => {
        try {
          const collections = await platform.collections.list();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(collections, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      },
    },
    // ... other tools
  };
}
```

**Files to create**:
1. `src/tools/collection-tools.ts` (2 hours)
2. `src/tools/record-tools.ts` (2 hours)
3. `src/tools/auth-tools.ts` (1.5 hours)
4. `src/tools/storage-tools.ts` (1.5 hours)
5. `src/tools/debug-tools.ts` (1 hour)
6. `src/tools/development-tools.ts` (2 hours)

---

### Phase 5: Resource Handlers (2 hours)

**File**: `src/resources/collections.ts`
```typescript
import type { PocketBasePlatform } from '../platform/types.js';
import type { ReadResourceResult } from '@modelcontextprotocol/server';

export function createCollectionResources(platform: PocketBasePlatform) {
  return {
    collections: {
      uri: 'pocketbase://collections',
      name: 'All Collections',
      description: 'Schema definitions for all PocketBase collections',
      mimeType: 'application/json',
      handler: async (): Promise<ReadResourceResult> => {
        const collections = await platform.collections.list();
        return {
          contents: [{
            uri: 'pocketbase://collections',
            mimeType: 'application/json',
            text: JSON.stringify(collections, null, 2)
          }]
        };
      },
    },
    collection: {
      uriTemplate: 'pocketbase://collections/{name}',
      name: 'Single Collection',
      description: 'Schema definition for a specific collection',
      mimeType: 'application/json',
      handler: async (uri: any, params: { name: string }): Promise<ReadResourceResult> => {
        const collection = await platform.collections.get(params.name);
        return {
          contents: [{
            uri: `pocketbase://collections/${params.name}`,
            mimeType: 'application/json',
            text: JSON.stringify(collection, null, 2)
          }]
        };
      },
    },
  };
}
```

---

### Phase 6: Server Integration (2-3 hours)

**File**: `src/server.ts`
```typescript
import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server';
import type { Config } from './config.js';
import type { PocketBasePlatform } from './platform/types.js';
import { createPocketBaseSDKPlatform } from './platform/sdk-platform.js';
import { getCollectionTools } from './tools/collection-tools.js';
import { getRecordTools } from './tools/record-tools.js';
import { getAuthTools } from './tools/auth-tools.js';
import { getStorageTools } from './tools/storage-tools.js';
import { getDebugTools } from './tools/debug-tools.js';
import { getDevelopmentTools } from './tools/development-tools.js';
import { createCollectionResources } from './resources/collections.js';

export function createPocketBaseMCP(config: Config) {
  const platform = createPocketBaseSDKPlatform(config);
  
  const server = new McpServer(
    {
      name: 'pocketbase-vibe-mcp',
      version: '1.0.0',
      description: 'MCP server for PocketBase database operations'
    },
    {
      capabilities: {
        logging: {},
        tools: {},
        resources: {}
      }
    }
  );

  // Register all tool groups
  const allTools = {
    ...getCollectionTools(platform, config.readOnly),
    ...getRecordTools(platform, config.readOnly),
    ...getAuthTools(platform, config.readOnly),
    ...getStorageTools(platform, config.readOnly),
    ...getDebugTools(platform, config.readOnly),
    ...getDevelopmentTools(platform, config.readOnly),
  };

  // Register each tool
  for (const [name, tool] of Object.entries(allTools)) {
    server.registerTool(name, tool);
  }

  // Register resources
  const resources = createCollectionResources(platform);
  for (const [name, resource] of Object.entries(resources)) {
    server.registerResource(name, resource.uri || resource.uriTemplate, {
      title: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }, resource.handler);
  }

  return { server, platform };
}
```

---

### Phase 7: CLI Entry Point (1 hour)

**File**: `src/index.ts`
```typescript
#!/usr/bin/env node
import { loadConfig } from './config.js';
import { createPocketBaseMCP } from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/server';

async function main() {
  try {
    const config = loadConfig();
    const { server } = createPocketBaseMCP(config);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('PocketBase Vibe MCP server running on stdio');
  } catch (error) {
    console.error(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

main();
```

---

### Phase 8: Testing (4-5 hours)

**Unit Tests**:
- Platform layer operations
- Read-only enforcement
- Tool input/output validation
- Error wrapping

**Integration Tests** (requires running PocketBase):
- Full CRUD cycle
- Read-only mode blocking
- User management
- File operations

---

### Phase 9: Documentation (2-3 hours)

**README.md Sections**:
1. Overview
2. Quick Start
3. Configuration (CLI, env, file)
4. Tools Reference (all 22 tools)
5. Resources Reference
6. Read-Only Mode
7. Security
8. Claude Code Integration
9. Troubleshooting

---

### Phase 10: Polish & Verification (2 hours)

**Checklist**:
- [ ] All tools have complete descriptions
- [ ] Error messages are user-friendly
- [ ] Read-only enforcement tested
- [ ] TypeScript types exported
- [ ] README examples tested
- [ ] Build succeeds
- [ ] Linting passes (if configured)

---

## Success Criteria

### MVP Complete
- [x] Architecture documented
- [x] Plan documented
- [x] Tool specs documented
- [ ] Project initialized
- [ ] All 6 tool groups implemented (22 tools)
- [ ] Read-only mode working
- [ ] Connects to PocketBase successfully
- [ ] Tests passing

### Production Ready
- [ ] Documentation complete
- [ ] Error handling robust
- [ ] Security review passed
- [ ] Real-world testing with AI agents

---

## Unique Features (Differentiation)

Based on competitive analysis of 8+ existing PocketBase MCP implementations:

1. ✅ **Read-only mode** - Safe for production databases
2. ✅ **Supabase MCP parity** - Familiar patterns for Supabase users
3. ✅ **Schema-aware validation** - Validate writes against collection schema
4. ✅ **Clean architecture** - Platform abstraction layer for testability
5. ✅ **Comprehensive documentation** - Tool descriptions, examples, troubleshooting

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Project Setup | 2-3h | 3h |
| 2. Configuration | 2h | 5h |
| 3. Platform | 4-5h | 10h |
| 4. Tools | 8-10h | 20h |
| 5. Resources | 2h | 22h |
| 6. Server Integration | 2-3h | 25h |
| 7. CLI | 1h | 26h |
| 8. Testing | 4-5h | 31h |
| 9. Documentation | 2-3h | 34h |
| 10. Polish | 2h | 36h |

**Total**: 29-36 hours (4-5 working days)

---

## Next Steps

1. ✅ Documentation complete
2. ⏳ Initialize GitHub repo
3. ⏳ Phase 1: Project Setup
4. ⏳ Phase 2-10: Sequential implementation

**Ready to begin implementation.**
