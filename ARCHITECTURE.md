# PocketBase MCP Architecture

## Overview

PocketBase MCP is a Model Context Protocol server that exposes PocketBase backend operations to AI assistants. Designed to match Supabase MCP functionality while respecting PocketBase's single-instance architecture.

**Target User**: AI coding agents (Claude Code, etc.) managing PocketBase instances during development.

---

## Architectural Decisions

### 1. Server Architecture: Single Unified Server

**Decision**: Single server exposing all operations

**Rationale**:
- PocketBase is inherently single-tenant (one instance per project)
- Unlike Supabase's multi-project platform, no need for account/project management
- Simpler deployment and configuration

**Impact**: One binary, one connection model, unified auth.

---

### 2. Authentication: Admin Token Only

**Decision**: MCP operates with PocketBase admin token only

**Configuration**:
```bash
# CLI args
--admin-token <token>

# Environment variable
POCKETBASE_ADMIN_TOKEN=<token>

# Priority: CLI args > env vars > config file
```

**Security Model**:
- Admin token has full control over PocketBase instance
- Intended for development/agent use, not production end-user access
- Trust boundary: MCP client must be trusted

**Impact**: No per-user token management, no RBAC within MCP layer.

---

### 3. Read-Only Enforcement: MCP Layer

**Decision**: Implement read-only mode at MCP tool layer

**Mechanism**:
```bash
# Enable read-only mode
--read-only

# Environment variable
POCKETBASE_READONLY=true
```

**Enforcement**:
- Read operations: `list_*`, `get_*`, `query_*` → Always allowed
- Write operations: `create_*`, `update_*`, `delete_*` → Blocked in read-only mode
- Schema mutations: Blocked in read-only mode

**Rationale**:
- PocketBase has no native read-only mode (unlike Postgres)
- Users requiring writes should use PocketBase dashboard directly
- Protects against accidental destructive operations by AI agents

**Error Message** (when blocked):
```
Operation 'create_collection' is blocked in read-only mode. 
Use the PocketBase dashboard (URL: <admin-url>) to make schema changes.
```

**Impact**: All write tools must check read-only flag before execution.

---

### 4. Feature Scope: Supabase MCP Parity

**Decision**: Match Supabase MCP tool categories and operations

**Tool Groups** (6 categories):

| Group | Supabase Equivalent | PocketBase Implementation |
|-------|---------------------|---------------------------|
| **database** | `list_tables`, `execute_sql` | Collections API (schema) |
| **records** | N/A (via SQL) | Records API (CRUD) |
| **auth** | Auth management | Users/Accounts API |
| **storage** | `list_storage_buckets`, file ops | File collections API |
| **debugging** | `get_logs` | Logs API |
| **development** | `generate_typescript_types` | TypeScript SDK generator |

**Skipped Features** (do not exist in PocketBase):
- ❌ `list_organizations`, `list_projects` (single-instance)
- ❌ `create_project`, `delete_project` (N/A)
- ❌ `list_migrations`, `apply_migration` (no migration history)
- ❌ `deploy_edge_function` (PocketBase uses Go hooks, not Deno)
- ❌ Realtime subscriptions (MCP is request-response)

**Impact**: 6 tool groups, ~25-30 total tools.

---

### 5. Collections as Resources + Tools

**Decision**: Hybrid approach for schema discovery + operations

**Resources** (for LLM discovery):
```
pocketbase://collections          → List all collection schemas
pocketbase://collections/{name}   → Single collection schema
```

**Tools** (for operations):
```typescript
// Schema operations
list_collections()
get_collection(name: string)
create_collection(schema: CollectionSchema)
update_collection(name: string, schema: CollectionSchema)
delete_collection(name: string)

// Data operations
query_collection(collection: string, filter?: Filter, options?: QueryOptions)
get_record(collection: string, id: string)
create_record(collection: string, data: RecordData)
update_record(collection: string, id: string, data: Partial<RecordData>)
delete_record(collection: string, id: string)
```

**Rationale**:
- Resources enable LLMs to discover schema without calling tools
- Tools provide controlled mutation and querying
- Matches Supabase MCP pattern (resources for OpenAPI spec, tools for CRUD)

**Impact**: Define both resource handlers and tool implementations.

---

### 6. Connection Configuration: Multi-Source

**Decision**: Support CLI args, environment variables, and config files

**Priority Order**:
1. CLI arguments (highest)
2. Environment variables
3. Config file (lowest)

**Configuration Options**:
```bash
# CLI arguments
pocketbase-mcp \
  --url http://localhost:8090 \
  --admin-token <token> \
  --read-only

# Environment variables
export POCKETBASE_URL=http://localhost:8090
export POCKETBASE_ADMIN_TOKEN=<token>
export POCKETBASE_READONLY=true

# Config file
pocketbase-mcp --config ~/.pocketbase-mcp.json
```

**Config File Format** (`~/.pocketbase-mcp.json`):
```json
{
  "url": "http://localhost:8090",
  "adminToken": "<token>",
  "readOnly": false
}
```

**Impact**: Configuration parsing layer with priority resolution.

---

### 7. SDK vs. Raw HTTP: PocketBase JS SDK

**Decision**: Use official PocketBase JavaScript SDK

**Package**: `pocketbase` (npm)

**Rationale**:
- Type safety (TypeScript definitions included)
- Automatic token refresh handling
- Built-in auth management
- Lightweight (~10KB bundled)
- Official maintenance by PocketBase team

**Impact**: Single dependency, SDK error types, cleaner implementation.

---

### 8. Migrations: Skip (Direct Mutations)

**Decision**: No migration tracking - direct schema mutations

**Rationale**:
- PocketBase doesn't have migration history (unlike Supabase)
- Simpler mental model for agents
- Matches PocketBase dashboard behavior

**Mitigation**:
- Destructive operations include warnings in tool descriptions
- Encourage users to backup before schema changes
- Consider future `_mcp_migrations` collection for audit trail (v2)

**Impact**: `update_collection` and `delete_collection` are immediate and irreversible via MCP.

---

### 9. Realtime Subscriptions: Skip

**Decision**: No realtime support in v1

**Rationale**:
- MCP protocol is request-response, not streaming
- Supabase MCP doesn't expose realtime
- PocketBase realtime requires WebSocket/SSE maintenance
- Better suited for direct client connections

**Impact**: Out of scope for v1. Document in README.

---

### 10. Error Handling: Wrapped Errors

**Decision**: Wrap PocketBase errors with context, sanitize sensitive data

**Pattern**:
```typescript
try {
  await pb.collection('users').getOne(id);
} catch (error) {
  throw new MCPError(
    `Failed to fetch record '${id}' from collection 'users': ${error.message} (${error.status})`
  );
}
```

**Sanitization Rules**:
- NEVER include admin token in error messages
- Sanitize URLs if they contain tokens
- Redact sensitive field values in responses

**Impact**: Custom error wrapper, consistent error format.

---

### 11. Platform Abstraction: Yes

**Decision**: Implement `PocketBaseOperations` interface

**Structure**:
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
// ... etc
```

**Implementation**: `SDKPlatform` class implements `PocketBaseOperations` using PocketBase SDK

**Benefits**:
- Mockable for tests
- Clean separation from MCP tool layer
- Future extensibility (e.g., multiple instances)

**Impact**: Additional abstraction layer (~200 LOC), worth it for testability.

---

## Project Structure

```
pocketbase-mcp/
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── server.ts                 # MCP server creation + tool registry
│   ├── config.ts                 # Configuration loading
│   ├── types.ts                  # Types + feature groups
│   ├── platform/
│   │   ├── types.ts              # PocketBaseOperations interface
│   │   └── sdk-platform.ts       # SDK implementation
│   ├── tools/
│   │   ├── collection-tools.ts   # Database tools
│   │   ├── record-tools.ts       # Records CRUD
│   │   ├── auth-tools.ts         # User management
│   │   ├── storage-tools.ts      # File operations
│   │   ├── debug-tools.ts        # Logs
│   │   └── development-tools.ts  # TypeScript generation
│   ├── resources/
│   │   └── collections.ts        # Collection schema resources
│   └── errors.ts                 # Error wrapper
├── tests/
│   ├── platform/
│   ├── tools/
│   └── integration/
├── package.json
├── tsconfig.json
├── README.md
└── ARCHITECTURE.md
```

---

## Dependencies

```json
{
  "dependencies": {
    "pocketbase": "^0.21.0",
    "@anthropic/mcp-sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## Security Considerations

1. **Admin Token Storage**: Tokens stored in environment variables or config file (not in code)
2. **Read-Only Default**: Consider making `--read-only` the default, opt-out for writes
3. **No Token in Logs**: Sanitize all error messages and debug output
4. **Trust Boundary**: MCP client must be trusted (not for public-facing APIs)

---

## Future Considerations (v2)

- Multiple connection profiles (switch between instances)
- `_mcp_migrations` collection for audit trail
- OAuth token support (per-user mode)
- Custom tool extensions (plugin system)

---

## Decision Log

| Date | Decision | Changed |
|------|----------|---------|
| 2026-04-07 | Initial architecture defined | - |
| 2026-04-07 | Admin token only confirmed | User requirement |
| 2026-04-07 | Read-only enforcement required | User requirement |
| 2026-04-07 | Supabase MCP parity mandatory | User requirement |
