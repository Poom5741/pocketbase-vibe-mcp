# PocketBase MCP Implementation Plan

**Last Updated**: 2026-04-07  
**Status**: Validated - Ready for Implementation  
**Analysis**: Deep analysis completed with Metis + Momus + MCP SDK validation

---

## Phase Overview

**Goal**: Build PocketBase MCP server with feature parity to Supabase MCP  
**Estimated Effort**: 35-45 hours (5-6 working days)  
**Target**: MVP with 6 tool groups, ~25-30 tools

### Key Updates (Post-Analysis)

✅ **MCP SDK Validated**: Use `@modelcontextprotocol/server` (official SDK)  
⏳ **PocketBase SDK**: Requires validation (Phase 0 - 3-4 hours)  
✅ **Timeline**: Revised to 35-45h (realistic estimates)  
✅ **Error Taxonomy**: Defined below  
✅ **Pagination**: Specification added  
✅ **Security**: Warnings and boundaries defined

---

## 🔴 REQUIRED: Phase 0 - PocketBase SDK Validation (3-4 hours)

### ⚠️ MANDATORY BEFORE PHASE 1

**Goal**: Validate PocketBase JavaScript SDK supports all required admin operations

### Tasks

#### 0.1 Setup PocketBase Instance (30 min)
```bash
# Run PocketBase via Docker
docker run -p 8090:8090 pocketbase/pocketbase

# Or download binary from https://pocketbase.io
./pocketbase serve
```

#### 0.2 Create Admin Token (15 min)
1. Navigate to http://localhost:8090/_/
2. Create admin account
3. Generate admin token

#### 0.3 Test SDK Operations (2-3 hours)

Create validation script:
```typescript
// spikes/pocketbase-validation/validate.ts
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// TEST 1: Admin authentication
console.log('Testing admin auth...');
await pb.authStore.save(token, null);
// or: await pb.adminAuth(token);
// Verify: pb.authStore.isValid === true

// TEST 2: List collections
console.log('Testing list collections...');
const collections = await pb.collections.getList();
// Verify: Returns array of collections

// TEST 3: Get single collection
console.log('Testing get collection...');
const collection = await pb.collections.getOne('users');
// Verify: Returns collection object

// TEST 4: Create collection
console.log('Testing create collection...');
const newCollection = await pb.collections.create({
  name: 'test_collection',
  fields: [/* field definitions */]
});
// Verify: Collection created successfully

// TEST 5: Query records
console.log('Testing query records...');
const records = await pb.collection('users').getList(1, 50);
// Verify: Returns paginated records

// TEST 6: Create record
console.log('Testing create record...');
const record = await pb.collection('users').create({
  email: 'test@example.com',
  password: 'securepass123'
});
// Verify: Record created

// TEST 7: Error handling
console.log('Testing error handling...');
try {
  await pb.collections.getOne('nonexistent');
} catch (error) {
  console.log('Error type:', error.constructor.name);
  console.log('Error message:', error.message);
  console.log('Error status:', error.status);
}
```

#### 0.4 Document Findings (30 min)

Create findings document:
```markdown
## PocketBase SDK Validation Results

### ✅ Supported Operations
- [ ] Admin auth: Method used - ________
- [ ] List collections: Method used - ________
- [ ] Get collection: Method used - ________
- [ ] Create collection: Method used - ________
- [ ] Update collection: Method used - ________
- [ ] Delete collection: Method used - ________
- [ ] Query records: Method used - ________
- [ ] Create record: Method used - ________
- [ ] Update record: Method used - ________
- [ ] Delete record: Method used - ________

### ❌ Gaps (requires HTTP fallback)
- [ ] Operation 1: Requires HTTP call to /api/...
- [ ] Operation 2: ...

### Error Types Observed
- 404: PocketBaseError (or whatever type)
- 400: PocketBaseError
- 401: PocketBaseError
- 403: PocketBaseError
- Network errors: JavaScript Error

### TypeScript Definitions
- [ ] Included in package
- [ ] Type coverage: Good / Partial / Poor
- [ ] Any type gaps: ________

### Decision
☐ YES - SDK covers all required operations, proceed with abstraction  
☐ PARTIAL - SDK covers most, need HTTP fallback for: ________  
☐ NO - SDK insufficient, must use raw HTTP client

```

### Decision Gate

After Phase 0, answer:

1. **Can PocketBase SDK handle admin operations?** (YES/NO/PARTIAL)
2. **What's the actual admin auth API?** (`pb.authStore.save` vs `pb.adminAuth`)
3. **Are there SDK gaps requiring HTTP fallback?** (List operations)
4. **Proceed to Phase 1?** (YES/NO/REVISE)

**If PARTIAL/NO**: Revise platform abstraction to use HTTP client for gaps  
**If YES**: Proceed with SDK-only implementation

---

## Phase 1: Project Setup (3-4 hours)

### Tasks

1. **Initialize Project**
   ```bash
   npm init -y
   npm install pocketbase @modelcontextprotocol/server zod
   npm install -D typescript vitest @types/node tsx eslint prettier
   npx tsc --init
   ```

2. **Configure TypeScript**
   - ES2022 target
   - ESM modules (`"module": "ES2022"`, `"moduleResolution": "bundler"`)
   - Strict mode enabled (`"strict": true`)
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
   │   ├── types.ts
   │   ├── readonly.ts
   │   └── sdk-platform.ts
   ├── tools/
   │   ├── collection-tools.ts
   │   ├── record-tools.ts
   │   ├── auth-tools.ts
   │   ├── storage-tools.ts
   │   ├── debug-tools.ts
   │   └── development-tools.ts
   └── resources/
       └── collections.ts
   tests/
   ├── platform/
   ├── tools/
   └── integration/
   ```

4. **Setup Package.json Scripts**
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "tsx src/index.ts",
       "test": "vitest",
       "test:watch": "vitest --watch",
       "test:integration": "vitest run tests/integration",
       "lint": "eslint src tests",
       "format": "prettier --write src tests"
     },
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

**Verification**: `npm run build` compiles without errors

---

## Phase 2: Configuration Layer (2-3 hours)

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
1. Parse CLI args (use `process.argv` for simplicity)
2. Read env vars (`POCKETBASE_URL`, `POCKETBASE_ADMIN_TOKEN`, `POCKETBASE_READONLY`)
3. Load config files with priority:
   - Project-local: `./.pocketbase-mcp.json`
   - XDG config: `$XDG_CONFIG_HOME/pocketbase-mcp/config.json`
   - Global: `~/.pocketbase-mcp.json`
4. Merge with priority resolution
5. Validate: URL is valid, token is non-empty
6. Node.js path handling: `os.homedir()`, `process.env.XDG_CONFIG_HOME`

**Tests**:
- Priority resolution (CLI overrides env)
- Validation errors (missing token, invalid URL)
- Config file parsing with different paths

---

## Phase 3: Platform Abstraction (6-8 hours)

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
  query(collection: string, options?: QueryOptions): Promise<PaginatedResult<Record>>;
  get(collection: string, id: string): Promise<Record>;
  create(collection: string, data: RecordData): Promise<Record>;
  update(collection: string, id: string, data: Partial<RecordData>): Promise<Record>;
  delete(collection: string, id: string): Promise<void>;
}

// ... etc for users, files, debugging, development
```

### File: `src/platform/readonly.ts`

**Define operation categorization**:
```typescript
export const WRITE_OPERATIONS = [
  'create_collection', 'update_collection', 'delete_collection',
  'create_record', 'update_record', 'delete_record',
  'create_user', 'update_user', 'delete_user',
  'upload_file', 'delete_file'
] as const;

export const READ_OPERATIONS = [
  'list_collections', 'get_collection',
  'query_collection', 'get_record',
  'list_users', 'get_user',
  'list_files',
  'generate_typescript_types', 'get_api_url', 'get_health_status'
] as const;

export class ReadOnlyError extends Error {
  constructor(operation: string) {
    super(
      `Operation '${operation}' is blocked in read-only mode. ` +
      `Use the PocketBase dashboard to make schema changes.`
    );
  }
}
```

### File: `src/platform/sdk-platform.ts`

**Implementation**:
```typescript
import PocketBase from 'pocketbase';
import { PocketBaseOperations } from './types';
import { READ_OPERATIONS, ReadOnlyError } from './readonly';
import { PocketBaseMCPError, ErrorType } from '../errors';

export class SDKPlatform implements PocketBaseOperations {
  private pb: PocketBase;
  private readOnly: boolean;

  constructor(config: Config) {
    this.pb = new PocketBase(config.url);
    // Using actual API from validation:
    this.pb.authStore.save(config.adminToken, null); // or pb.adminAuth(token)
    this.readOnly = config.readOnly;
  }

  private assertWritable(operation: string) {
    if (this.readOnly && operation.includes('create') || operation.includes('update') || operation.includes('delete')) {
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

## Phase 4: Tool Implementations (12-16 hours)

### Tool Pattern

Each tool file exports:
```typescript
import { Server } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { PocketBaseOperations } from '../platform/types';

export function createCollectionTools(server: Server, operations: PocketBaseOperations) {
  server.tool(
    'list_collections',
    'List all collection schemas',
    z.object({}), // No input parameters
    async () => {
      try {
        const result = await operations.collections.list();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        const wrapped = wrapError(error);
        return {
          content: [{ type: 'text', text: `Error: ${wrapped.message}` }],
          isError: true
        };
      }
    }
  );
}
```

### Tool Group 1: Database/Collections (2-3 hours)

**File**: `src/tools/collection-tools.ts`

**Tools**:
1. `list_collections()` - List all collection schemas
2. `get_collection(name: string)` - Get single collection schema
3. `create_collection(schema: CollectionSchema)` - Create new collection ⚠️ Write
4. `update_collection(name: string, schema: CollectionSchema)` - Update collection ⚠️ Write
5. `delete_collection(name: string)` - Delete collection ⚠️ Write

**Supabase Parity**:
- `list_tables` → `list_collections`
- Schema discovery → Collection schemas

---

### Tool Group 2: Records (3-4 hours)

**File**: `src/tools/record-tools.ts`

**Tools**:
1. `query_collection(collection: string, filter?: string, page?: number, perPage?: number)` - Query with filters
2. `get_record(collection: string, id: string)` - Get single record
3. `create_record(collection: string, data: RecordData)` - Create record ⚠️ Write
4. `update_record(collection: string, id: string, data: Partial<RecordData>)` - Update record ⚠️ Write
5. `delete_record(collection: string, id: string)` - Delete record ⚠️ Write

**Supabase Parity**:
- `execute_sql(SELECT)` → `query_collection`
- `execute_sql(INSERT/UPDATE/DELETE)` → CRUD operations

---

### Tool Group 3: Auth (2-3 hours)

**File**: `src/tools/auth-tools.ts`

**Tools**:
1. `list_users(filter?: string, page?: number, perPage?: number)` - List users
2. `get_user(id: string)` - Get user
3. `create_user(data: UserData)` - Create user ⚠️ Write
4. `update_user(id: string, data: Partial<UserData>)` - Update user ⚠️ Write
5. `delete_user(id: string)` - Delete user ⚠️ Write

**Supabase Parity**:
- Auth management tools

---

### Tool Group 4: Storage (2-3 hours)

**File**: `src/tools/storage-tools.ts`

**Tools**:
1. `list_files(collection: string, recordId: string)` - List files in record
2. `upload_file(collection: string, recordId: string, field: string, file: string)` - Upload file ⚠️ Write
3. `delete_file(collection: string, recordId: string, field: string)` - Delete file ⚠️ Write

**Supabase Parity**:
- `list_storage_buckets`
- File operations

**Note**: File upload mechanism needs validation - may require raw HTTP for multipart

---

### Tool Group 5: Debugging (1-2 hours)

**File**: `src/tools/debug-tools.ts`

**Tools**:
1. `get_logs(options?: { limit?: number })` - Get instance logs

**Supabase Parity**:
- `get_logs`

**Note**: Requires validation that PocketBase exposes logs via API. May need to defer to v2 if unavailable.

---

### Tool Group 6: Development (2-3 hours)

**File**: `src/tools/development-tools.ts`

**Tools**:
1. `generate_typescript_types()` - Generate TypeScript SDK types from collection schemas
2. `get_api_url()` - Get API base URL
3. `get_health_status()` - Check instance health

**Supabase Parity**:
- `generate_typescript_types`

---

## Phase 5: Resource Handlers (2-3 hours)

### File: `src/resources/collections.ts`

**Resources**:
```typescript
import { Server } from '@modelcontextprotocol/server';

export function createCollectionResources(server: Server, operations: PocketBaseOperations) {
  server.resource(
    'collections',
    new URI('pocketbase://collections'),
    async (uri) => {
      const collections = await operations.collections.list();
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(collections, null, 2)
        }]
      };
    }
  );

  server.resource(
    'collection',
    new URI('pocketbase://collections/{name}'),
    async (uri, { name }) => {
      const collection = await operations.collections.get(name);
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(collection, null, 2)
        }]
      };
    }
  );
}
```

---

## Phase 6: Server Integration (3-4 hours)

### File: `src/server.ts`

**Responsibilities**:
- Create MCP server instance
- Register all tools
- Register all resources
- Handle tool invocations

**Implementation**:
```typescript
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

  const operations = new SDKPlatform(config);

  // Register tool groups
  createCollectionTools(server, operations);
  createRecordTools(server, operations);
  createAuthTools(server, operations);
  createStorageTools(server, operations);
  createDebugTools(server, operations);
  createDevelopmentTools(server, operations);

  // Register resources
  createCollectionResources(server, operations);

  return { server, operations };
}
```

---

## Phase 7: CLI Entry Point (1-2 hours)

### File: `src/index.ts`

**Implementation**:
```typescript
#!/usr/bin/env node
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

## Phase 8: Testing (8-10 hours)

### Test Infrastructure Setup

```yaml
# docker-compose.test.yml
services:
  pocketbase:
    image: pocketbase/pocketbase:latest
    ports:
      - "8090:8090"
    volumes:
      - ./tmp/pb_data:/pb_data
```

### Unit Tests

**Platform Layer**:
- `tests/platform/operations.test.ts` - Mock SDK, test each operation
- `tests/platform/readonly.test.ts` - Verify read-only enforcement

**Tool Handlers**:
- `tests/tools/collections.test.ts` - Tool input/output validation
- `tests/tools/error-handling.test.ts` - Error wrapping

### Integration Tests

**Requirements**:
- Running PocketBase instance (Docker or local)
- Test data setup/teardown scripts

**Tests**:
- `tests/integration/crud.test.ts` - Full CRUD cycle
- `tests/integration/readonly.test.ts` - Read-only mode blocks writes
- `tests/integration/pagination.test.ts` - Pagination for large datasets

### Test Commands

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test:integration  # Integration tests only (requires Docker)
```

---

## Phase 9: Documentation (3-4 hours)

### README.md

**Sections**:
1. **Overview** - What is PocketBase MCP
2. **Installation** - npm install, binary usage
3. **Quick Start** - Connect to local instance
4. **Configuration** - CLI args, env vars, config file
5. **Tools Reference** - All tools with examples
6. **Resources Reference** - Available resources
7. **Read-Only Mode** - How to enable, what's blocked
8. **Error Handling** - Error types and retry guidance
9. **Security** - Admin token handling, warnings
10. **Troubleshooting** - Common issues

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

## Phase 10: Polish & Verification (2-3 hours)

### Checklist

- [ ] All tools have complete descriptions
- [ ] Error messages are user-friendly
- [ ] Read-only enforcement tested
- [ ] TypeScript types exported
- [ ] README examples tested
- [ ] No console.log in production
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Tests pass (unit + integration)

### Verification Steps

1. **Build**: `npm run build`
2. **Lint**: `npm run lint`
3. **Test**: `npm test`
4. **Manual Test**: Connect to local PocketBase, run through all tools
5. **Claude Test**: Use with Claude Code, verify tool discovery

---

## Milestone Summary

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 0 | PocketBase SDK Validation | 3-4h | Pending |
| 1 | Project Setup | 3-4h | Pending |
| 2 | Configuration Layer | 2-3h | Pending |
| 3 | Platform Abstraction | 6-8h | Pending |
| 4 | Tool Implementations | 12-16h | Pending |
| 5 | Resource Handlers | 2-3h | Pending |
| 6 | Server Integration | 3-4h | Pending |
| 7 | CLI Entry Point | 1-2h | Pending |
| 8 | Testing | 8-10h | Pending |
| 9 | Documentation | 3-4h | Pending |
| 10 | Polish & Verification | 2-3h | Pending |

**Total**: ~35-45 hours (5-6 working days with buffer)

---

## Error Taxonomy

### Error Types

```typescript
export enum ErrorType {
  NOT_FOUND,        // 404 - Resource doesn't exist (not retryable)
  VALIDATION_ERROR, // 400 - Invalid input (not retryable)
  AUTH_ERROR,       // 401/403 - Token invalid/expired (not retryable)
  PERMISSION_DENIED,// 403 - Insufficient permissions (not retryable)
  NETWORK_ERROR,    // ECONNRESET - Connection issues (retryable)
  RATE_LIMITED,     // 429 - Too many requests (retryable with backoff)
  SERVER_ERROR,     // 5xx - PocketBase server error (retryable)
  TIMEOUT_ERROR     // ETIMEDOUT - Request timeout (retryable)
}
```

### Error Mapping

| PocketBase Response | ErrorType | Retryable |
|---------------------|-----------|-----------|
| 404 Not Found | NOT_FOUND | No |
| 400 Bad Request | VALIDATION_ERROR | No |
| 401 Unauthorized | AUTH_ERROR | No |
| 403 Forbidden | PERMISSION_DENIED | No |
| 429 Too Many Requests | RATE_LIMITED | Yes (with backoff) |
| 5xx Server Error | SERVER_ERROR | Yes |
| Network Error | NETWORK_ERROR | Yes |
| Timeout | TIMEOUT_ERROR | Yes |

### Error Response Format

```typescript
interface ErrorResponse {
  type: ErrorType;
  message: string;
  suggestion?: string; // Guidance for AI agent
}
```

---

## Pagination Specification

### All List Operations Support

```typescript
interface ListOptions {
  page?: number;      // default: 1, minimum: 1
  perPage?: number;   // default: 50, min: 1, max: 500
  sort?: string;      // e.g., "-created,name" (created DESC, name ASC)
  filter?: string;    // PocketBase filter syntax
}
```

### Response Format

```typescript
interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}
```

### Default Behavior

- Return first page only (50 items max)
- AI must request additional pages explicitly
- Maximum total results: 1000 (enforced by pagination)

---

## Out of Scope (Future Enhancements)

These features are **explicitly NOT included** in MVP:

- ❌ Multiple connection profiles
- ❌ OAuth/user token authentication
- ❌ Migration history/tracking
- ❌ Plugin/extension system
- ❌ Realtime subscriptions (WebSocket)
- ❌ Advanced filtering/query builder
- ❌ Caching layer
- ❌ Performance metrics/telemetry
- ❌ Webhook management
- ❌ Backup/restore operations

---

## Security Boundaries

### ⚠️ Development Use Only

This MCP server is for **development environments only**:

- Uses admin tokens with **full PocketBase access**
- Should **NEVER** be:
  - Exposed to untrusted networks
  - Run in production environments
  - Used with production PocketBase instances (unless read-only)

### Token Security

- Store admin tokens in environment variables or config files
- **Never** commit tokens to version control
- Rotate tokens regularly
- Scope to development instances only

### Recommended Production Setup

For production-like testing:
1. Use separate PocketBase instance
2. Enable read-only mode by default
3. Use minimal-privilege admin user
4. Monitor and log all MCP operations

---

## Performance Guidelines

- **Tool response time**: <5 seconds under normal conditions
- **Query pagination**: Max 500 records per request
- **Timeout handling**: 30s timeout for long-running operations
- **Concurrent requests**: Support up to 10 concurrent tool invocations
- **Memory usage**: <100MB for MCP server process

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| PocketBase SDK missing admin APIs | HIGH | Medium | Phase 0 validation, HTTP fallback if needed |
| File upload mechanism unclear | MEDIUM | Medium | Early testing, document requirements |
| `get_logs` tool unimplementable | MEDIUM | Medium | Defer to v2, document in README |
| Tool complexity underestimation | MEDIUM | High | Time-box tool groups, ship MVP first |
| Integration test setup complexity | MEDIUM | High | Docker compose setup, document requirements |
| Read-only mode edge cases | LOW | Medium | Conservative blocking, comprehensive tests |

---

## Success Criteria

### ✅ MVP Complete

- [ ] All 6 tool groups implemented
- [ ] Read-only mode working
- [ ] Connects to PocketBase successfully
- [ ] Claude Code can discover and use tools
- [ ] Tests passing (60%+ coverage)
- [ ] Error taxonomy implemented

### 🎯 Production Ready

- [ ] Documentation complete
- [ ] Error handling robust
- [ ] Security review passed
- [ ] Real-world testing with AI agents
- [ ] Performance guidelines met

---

## Next Steps

1. **Complete Phase 0** - PocketBase SDK validation (3-4h) ⚠️ REQUIRED
2. **Review findings** - Update plan if SDK gaps found
3. **Begin Phase 1** - Project initialization
4. **Follow phases sequentially** - Each phase builds on previous
5. **Verify at each phase** - Don't proceed with failing tests

**Ready to start?**

First: Run Phase 0 validation.  
If validation passes → Proceed to Phase 1.

---

## Appendix: Package Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/server": "^1.0.0",
    "pocketbase": "^0.21.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### SDK Notes

- `@modelcontextprotocol/server`: Official MCP TypeScript SDK
- `pocketbase`: Official PocketBase JavaScript SDK
- `zod`: Peer dependency for MCP SDK schema validation
- `tsx`: TypeScript execution for development and testing
