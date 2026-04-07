# PocketBase MCP Implementation Plan

## Phase Overview

**Goal**: Build PocketBase MCP server with feature parity to Supabase MCP  
**Estimated Effort**: 2-3 days  
**Target**: MVP with 6 tool groups, ~25-30 tools

---

## Phase 1: Project Setup (2-3 hours)

### Tasks

1. **Initialize Project**
   ```bash
   npm init -y
   npm install pocketbase @anthropic/mcp-sdk
   npm install -D typescript vitest @types/node
   npx tsc --init
   ```

2. **Configure TypeScript**
   - ES2022 target
   - ESM modules
   - Strict mode enabled
   - OutDir: `./dist`

3. **Create Directory Structure**
   ```
   src/
   ├── index.ts
   ├── server.ts
   ├── config.ts
   ├── types.ts
   ├── errors.ts
   ├── platform/
   ├── tools/
   └── resources/
   tests/
   └── ...
   ```

4. **Setup Package.json Scripts**
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "tsx src/index.ts",
       "test": "vitest"
     }
   }
   ```

**Verification**: `npm run build` compiles without errors

---

## Phase 2: Configuration Layer (2 hours)

### File: `src/config.ts`

**Responsibilities**:
- Load config from CLI args, env vars, config file
- Priority resolution: CLI > env > file
- Validate required fields (URL, token)

**Interface**:
```typescript
interface Config {
  url: string;
  adminToken: string;
  readOnly: boolean;
}

function loadConfig(): Config;
function validateConfig(config: Config): void;
```

**Implementation Steps**:
1. Parse CLI args (use `process.argv` or `yargs`)
2. Read env vars (`POCKETBASE_URL`, `POCKETBASE_ADMIN_TOKEN`, `POCKETBASE_READONLY`)
3. Load config file (`--config` flag or default `~/.pocketbase-mcp.json`)
4. Merge with priority resolution
5. Validate: URL is valid, token is non-empty

**Tests**:
- Priority resolution (CLI overrides env)
- Validation errors (missing token, invalid URL)
- Config file parsing

---

## Phase 3: Platform Abstraction (4-5 hours)

### File: `src/platform/types.ts`

**Define interfaces**:
```typescript
interface PocketBaseOperations {
  collections: CollectionOperations;
  records: RecordOperations;
  users: UserOperations;
  files: FileOperations;
  debugging: DebugOperations;
  development: DevelopmentOperations;
}

interface CollectionOperations {
  list(): Promise<Collection[]>;
  get(name: string): Promise<Collection>;
  create(schema: CollectionSchema): Promise<Collection>;
  update(name: string, schema: CollectionSchema): Promise<Collection>;
  delete(name: string): Promise<void>;
}

interface RecordOperations {
  query(collection: string, options?: QueryOptions): Promise<Record[]>;
  get(collection: string, id: string): Promise<Record>;
  create(collection: string, data: RecordData): Promise<Record>;
  update(collection: string, id: string, data: Partial<RecordData>): Promise<Record>;
  delete(collection: string, id: string): Promise<void>;
}

// ... etc for users, files, debugging, development
```

### File: `src/platform/sdk-platform.ts`

**Implementation**:
```typescript
import PocketBase from 'pocketbase';
import type { PocketBaseOperations, ... } from './types';

export class SDKPlatform implements PocketBaseOperations {
  private pb: PocketBase;
  private readOnly: boolean;

  constructor(config: Config) {
    this.pb = new PocketBase(config.url);
    this.pb.adminAuth(config.adminToken);
    this.readOnly = config.readOnly;
  }

  collections = {
    list: async () => { ... },
    // ...
  };

  records = {
    query: async (collection, options) => { ... },
    // ...
  };

  // Check read-only before writes
  private assertWritable(operation: string) {
    if (this.readOnly) {
      throw new ReadOnlyError(operation);
    }
  }
}
```

**Tests**:
- Mock PocketBase SDK
- Test read-only enforcement
- Test error wrapping

---

## Phase 4: Tool Implementations (8-10 hours)

### Tool Group 1: Database/Collections (2 hours)

**File**: `src/tools/collection-tools.ts`

**Tools**:
1. `list_collections()` - List all collection schemas
2. `get_collection(name)` - Get single collection schema
3. `create_collection(schema)` - Create new collection
4. `update_collection(name, schema)` - Update collection
5. `delete_collection(name)` - Delete collection

**Supabase Parity**:
- `list_tables` → `list_collections`
- Schema discovery → Collection schemas

---

### Tool Group 2: Records (2 hours)

**File**: `src/tools/record-tools.ts`

**Tools**:
1. `query_collection(collection, filter, options)` - Query with filters
2. `get_record(collection, id)` - Get single record
3. `create_record(collection, data)` - Create record
4. `update_record(collection, id, data)` - Update record
5. `delete_record(collection, id)` - Delete record

**Supabase Parity**:
- `execute_sql(SELECT)` → `query_collection`
- `execute_sql(INSERT/UPDATE/DELETE)` → CRUD operations

---

### Tool Group 3: Auth (1.5 hours)

**File**: `src/tools/auth-tools.ts`

**Tools**:
1. `list_users(filter)` - List users
2. `get_user(id)` - Get user
3. `create_user(data)` - Create user
4. `update_user(id, data)` - Update user
5. `delete_user(id)` - Delete user

**Supabase Parity**:
- Auth management tools

---

### Tool Group 4: Storage (1.5 hours)

**File**: `src/tools/storage-tools.ts`

**Tools**:
1. `list_files(collection, recordId)` - List files in record
2. `upload_file(collection, recordId, field, file)` - Upload file
3. `delete_file(collection, recordId, field)` - Delete file

**Supabase Parity**:
- `list_storage_buckets`
- File operations

---

### Tool Group 5: Debugging (1 hour)

**File**: `src/tools/debug-tools.ts`

**Tools**:
1. `get_logs(options)` - Get instance logs

**Supabase Parity**:
- `get_logs`

---

### Tool Group 6: Development (1-2 hours)

**File**: `src/tools/development-tools.ts`

**Tools**:
1. `generate_typescript_types()` - Generate TypeScript SDK types
2. `get_api_url()` - Get API base URL
3. `get_health_status()` - Check instance health

**Supabase Parity**:
- `generate_typescript_types`

---

### Tool Pattern

Each tool file exports:
```typescript
import { Tool } from '@anthropic/mcp-sdk';
import type { PocketBaseOperations } from '../platform/types';

export function createCollectionTools(operations: PocketBaseOperations): Tool[] {
  return [
    {
      name: 'list_collections',
      description: 'List all collection schemas',
      inputSchema: { /* JSON Schema */ },
      handler: async (args) => {
        try {
          const result = await operations.collections.list();
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: wrapError(error) };
        }
      }
    },
    // ...
  ];
}
```

---

## Phase 5: Resource Handlers (2 hours)

### File: `src/resources/collections.ts`

**Resources**:
```typescript
import { Resource } from '@anthropic/mcp-sdk';

export function createCollectionResources(operations: PocketBaseOperations): Resource[] {
  return [
    {
      uri: 'pocketbase://collections',
      name: 'All Collections',
      description: 'Schema definitions for all collections',
      handler: async () => {
        const collections = await operations.collections.list();
        return {
          contents: [{
            uri: 'pocketbase://collections',
            mimeType: 'application/json',
            text: JSON.stringify(collections, null, 2)
          }]
        };
      }
    },
    {
      uriTemplate: 'pocketbase://collections/{name}',
      name: 'Single Collection',
      description: 'Schema definition for a specific collection',
      handler: async (uri, { name }) => {
        const collection = await operations.collections.get(name);
        return {
          contents: [{
            uri: `pocketbase://collections/${name}`,
            mimeType: 'application/json',
            text: JSON.stringify(collection, null, 2)
          }]
        };
      }
    }
  ];
}
```

---

## Phase 6: Server Integration (2-3 hours)

### File: `src/server.ts`

**Responsibilities**:
- Create MCP server instance
- Register all tools
- Register all resources
- Handle tool invocations

**Implementation**:
```typescript
import { Server } from '@anthropic/mcp-sdk';
import { createCollectionTools } from './tools/collection-tools';
import { createRecordTools } from './tools/record-tools';
// ... import other tool groups
import { createCollectionResources } from './resources/collections';
import { SDKPlatform } from './platform/sdk-platform';

export function createPocketBaseMCP(config: Config) {
  const operations = new SDKPlatform(config);
  const server = new Server({
    name: 'pocketbase-mcp',
    version: '1.0.0'
  });

  // Register tools
  const allTools = [
    ...createCollectionTools(operations),
    ...createRecordTools(operations),
    ...createAuthTools(operations),
    ...createStorageTools(operations),
    ...createDebugTools(operations),
    ...createDevelopmentTools(operations)
  ];

  allTools.forEach(tool => server.addTool(tool));

  // Register resources
  const allResources = createCollectionResources(operations);
  allResources.forEach(resource => server.addResource(resource));

  return server;
}
```

---

## Phase 7: CLI Entry Point (1 hour)

### File: `src/index.ts`

**Implementation**:
```typescript
#!/usr/bin/env node
import { loadConfig } from './config';
import { createPocketBaseMCP } from './server';
import { StdioServerTransport } from '@anthropic/mcp-sdk';

async function main() {
  const config = loadConfig();
  const server = createPocketBaseMCP(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

**CLI Argument Parsing**:
```bash
pocketbase-mcp [options]

Options:
  --url <url>              PocketBase instance URL
  --admin-token <token>    Admin authentication token
  --read-only              Enable read-only mode
  --config <path>          Path to config file
  --help                   Show help
```

---

## Phase 8: Testing (4-5 hours)

### Unit Tests

**Platform Layer**:
- `tests/platform/operations.test.ts` - Mock SDK, test each operation
- `tests/platform/readonly.test.ts` - Verify read-only enforcement

**Tool Handlers**:
- `tests/tools/collections.test.ts` - Tool input/output validation
- `tests/tools/error-handling.test.ts` - Error wrapping

### Integration Tests

**Requirements**:
- Running PocketBase instance (test container or local)
- Test data setup/teardown

**Tests**:
- `tests/integration/crud.test.ts` - Full CRUD cycle
- `tests/integration/readonly.test.ts` - Read-only mode blocks writes

### Test Commands

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test:integration  # Integration tests only
```

---

## Phase 9: Documentation (2-3 hours)

### README.md

**Sections**:
1. **Overview** - What is PocketBase MCP
2. **Installation** - npm install, binary usage
3. **Quick Start** - Connect to local instance
4. **Configuration** - CLI args, env vars, config file
5. **Tools Reference** - All tools with examples
6. **Resources Reference** - Available resources
7. **Read-Only Mode** - How to enable, what's blocked
8. **Security** - Admin token handling, warnings
9. **Troubleshooting** - Common issues

### Example Claude Integration

**Section**: Using with Claude Code

```bash
# Claude Code configuration
pocketbase-mcp \
  --url http://localhost:8090 \
  --admin-token $PB_ADMIN_TOKEN \
  --read-only
```

Add to `claude.json` or project config.

---

## Phase 10: Polish & Verification (2 hours)

### Checklist

- [ ] All tools have complete descriptions
- [ ] Error messages are user-friendly
- [ ] Read-only enforcement tested
- [ ] TypeScript types exported
- [ ] README examples tested
- [ ] No console.log in production
- [ ] Linting passes
- [ ] Build succeeds

### Verification Steps

1. **Build**: `npm run build`
2. **Lint**: `npm run lint` (if configured)
3. **Test**: `npm test`
4. **Manual Test**: Connect to local PocketBase, run through all tools
5. **Claude Test**: Use with Claude Code, verify tool discovery

---

## Milestone Summary

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Project Setup | 2-3h | Pending |
| 2 | Configuration Layer | 2h | Pending |
| 3 | Platform Abstraction | 4-5h | Pending |
| 4 | Tool Implementations | 8-10h | Pending |
| 5 | Resource Handlers | 2h | Pending |
| 6 | Server Integration | 2-3h | Pending |
| 7 | CLI Entry Point | 1h | Pending |
| 8 | Testing | 4-5h | Pending |
| 9 | Documentation | 2-3h | Pending |
| 10 | Polish & Verification | 2h | Pending |

**Total**: ~29-35 hours (4-5 working days with buffer)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PocketBase API differences from expected | Medium | Early integration test with real instance |
| MCP SDK API changes | Low | Pin SDK version, check changelog |
| Read-only enforcement edge cases | Medium | Comprehensive testing, conservative blocking |
| Tool complexity underestimation | Medium | Time-box each tool group, ship MVP first |

---

## Success Criteria

✅ **MVP Complete**:
- All 6 tool groups implemented
- Read-only mode working
- Connects to PocketBase successfully
- Claude Code can discover and use tools
- Tests passing

🎯 **Production Ready**:
- Documentation complete
- Error handling robust
- Security review passed
- Real-world testing with AI agents

---

## Next Steps

1. **Start Phase 1** - Initialize project structure
2. **Verify Supabase MCP reference** - Confirm tool names/signatures match
3. **Begin implementation** - Follow phases sequentially

Ready to start?
