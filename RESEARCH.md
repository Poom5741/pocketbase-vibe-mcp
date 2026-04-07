# PocketBase MCP Research Summary

**Compiled**: 2026-04-07  
**Purpose**: Reference documentation for PocketBase MCP implementation based on Supabase MCP patterns, PocketBase SDK capabilities, MCP best practices, and competitive landscape analysis.

---

## Table of Contents

1. [Supabase MCP Architecture Patterns](#1-supabase-mcp-architecture-patterns)
2. [PocketBase JS SDK API Reference](#2-pocketbase-js-sdk-api-reference)
3. [MCP Server Best Practices](#3-mcp-server-best-practices)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Implementation Recommendations](#5-implementation-recommendations)

---

## 1. Supabase MCP Architecture Patterns

### 1.1 Server Initialization Pattern

**Source**: `packages/mcp-server-supabase/src/server.ts`

```typescript
export function createSupabaseMcpServer(options: SupabaseMcpServerOptions) {
  const { platform, projectId, readOnly, features, onToolCall } = options;
  
  // Feature validation
  const enabledFeatures = parseFeatureGroups(platform, features ?? availableDefaultFeatures);
  
  const server = createMcpServer({
    name: 'supabase',
    title: 'Supabase',
    version,
    async onInitialize(info) {
      // Called when client connects
      await platform.init?.(info);
    },
    onToolCall,
    tools: async () => {
      // Dynamic tool loading - returns Record<string, Tool>
      const tools: Record<string, Tool> = {};
      if (enabledFeatures.has('database')) {
        Object.assign(tools, getDatabaseTools({ database, projectId, readOnly }));
      }
      // ... other features
      return tools;
    },
  });
  
  return server;
}
```

**Key Pattern**: Tools loaded dynamically based on enabled feature groups.

---

### 1.2 Platform Abstraction Layer

**Source**: `packages/mcp-server-supabase/src/platform/types.ts`

```typescript
export type SupabasePlatform = {
  init?(info: InitData): Promise<void>;
  account?: AccountOperations;
  database?: DatabaseOperations;
  functions?: EdgeFunctionsOperations;
  debugging?: DebuggingOperations;
  development?: DevelopmentOperations;
  storage?: StorageOperations;
  branching?: BranchingOperations;
};

export type DatabaseOperations = {
  executeSql<T>(projectId: string, options: ExecuteSqlOptions): Promise<T[]>;
  listMigrations(projectId: string): Promise<Migration[]>;
  applyMigration(projectId: string, options: ApplyMigrationOptions): Promise<void>;
};
```

**Key Pattern**: Interface defines operation groups, implementation is swappable.

---

### 1.3 Platform Implementation

**Source**: `packages/mcp-server-supabase/src/platform/api-platform.ts`

```typescript
export function createSupabaseApiPlatform(
  options: SupabaseApiPlatformOptions
): SupabasePlatform {
  const { accessToken, apiUrl } = options;
  const managementApiClient = createManagementApiClient(apiUrl, accessToken);
  
  const database: DatabaseOperations = {
    async executeSql<T>(projectId, options) {
      const response = await managementApiClient.POST(
        '/v1/projects/{ref}/database/query',
        { params: { path: { ref: projectId } }, body: options }
      );
      assertSuccess(response, 'Failed to execute SQL query');
      return response.data;
    },
    // ... other methods
  };
  
  return { init: ..., account, database, debugging, ... };
}
```

**Key Pattern**: Factory function returns platform object with all operations implemented.

---

### 1.4 Tool Definition with `injectableTool`

**Source**: `packages/mcp-server-supabase/src/tools/util.ts`

```typescript
export function injectableTool({
  description,
  annotations,
  parameters,
  outputSchema,
  inject,  // Static values injected into params
  execute,
}) {
  // Creates a masked schema without injected params
  const cleanParametersSchema = parameters.omit(mask);
  
  const executeWithInjection = async (args) => {
    return execute({ ...args, ...inject });
  };
  
  return tool({
    description,
    annotations,
    parameters: cleanParametersSchema,
    outputSchema,
    execute: executeWithInjection,
  });
}
```

**Key Pattern**: Inject static values (like `projectId`) without requiring user to pass them.

---

### 1.5 Read-Only Enforcement

**Source**: `packages/mcp-server-supabase/src/tools/storage-tools.ts`

```typescript
export function getStorageTools({ storage, projectId, readOnly }) {
  return {
    update_storage_config: injectableTool({
      ...storageToolDefs.update_storage_config,
      inject: { project_id: projectId },
      execute: async ({ project_id, config }) => {
        if (readOnly) {
          throw new Error('Cannot update storage config in read-only mode.');
        }
        await storage.updateStorageConfig(project_id, config);
        return { success: true };
      },
    }),
  };
}
```

**Key Pattern**: Check `readOnly` flag at the beginning of write operations.

---

### 1.6 Tool Annotations (MCP Standard)

**Source**: `packages/mcp-server-supabase/src/tools/database-operation-tools.ts`

```typescript
export const databaseToolDefs = {
  list_tables: {
    description: 'Lists all tables in one or more schemas...',
    parameters: listTablesInputSchema,
    outputSchema: listTablesOutputSchema,
    annotations: {
      title: 'List tables',
      readOnlyHint: true,        // Read-only operation
      destructiveHint: false,   // Doesn't modify data
      idempotentHint: true,     // Same result on repeated calls
      openWorldHint: false,     // Operates on known entities only
    },
  },
  apply_migration: {
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
} as const satisfies ToolDefs;
```

**Annotation Meanings**:
| Annotation | Values | Description |
|------------|--------|-------------|
| `readOnlyHint` | `true`/`false` | Does this operation read data without modification? |
| `destructiveHint` | `true`/`false` | May this operation destroy or modify data? |
| `idempotentHint` | `true`/`false` | Is calling this multiple times safe (same result)? |
| `openWorldHint` | `true`/`false` | Does this operate on external/unknown entities? |

---

### 1.7 Error Handling Pattern

**Source**: `packages/mcp-server-supabase/src/platform/api-platform.ts`

```typescript
function assertSuccess(response, errorMessage) {
  if (response.error) {
    throw new Error(`${errorMessage}: ${response.error.message}`);
  }
}

// Usage
const response = await managementApiClient.POST('/endpoint', options);
assertSuccess(response, 'Failed to execute operation');
```

**Key Pattern**: Wrap errors with context, never expose raw API errors.

---

### 1.8 CLI/Transport Setup

**Source**: `packages/mcp-server-supabase/src/transports/stdio.ts`

```typescript
async function main() {
  const { values: { ['access-token']: cliAccessToken, ... } } = parseArgs({...});
  
  const accessToken = cliAccessToken ?? process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Please provide a personal access token...');
    process.exit(1);
  }
  
  const platform = createSupabaseApiPlatform({ accessToken, apiUrl });
  const server = createSupabaseMcpServer({ platform, projectId, readOnly, features });
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

**Key Pattern**: CLI args > env vars priority, validate required credentials early.

---

### 1.9 Tool Organization

**File Structure**:
```
packages/mcp-server-supabase/src/tools/
├── util.ts              # injectableTool helper
├── tool-schemas.ts      # Tool definitions with annotations
├── database-operation-tools.ts
├── storage-tools.ts
├── debugging-tools.ts
├── docs-tools.ts
├── account-tools.ts
└── ...
```

**Key Pattern**: One file per feature group, export `get*Tools()` function.

---

## 2. PocketBase JS SDK API Reference

### 2.1 Initialization

```typescript
import PocketBase from 'pocketbase';

// Basic initialization
const pb = new PocketBase('http://127.0.0.1:8090');

// With custom auth store (for SSR)
import { AsyncAuthStore } from 'pocketbase';
const store = new AsyncAuthStore({
    save: async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
    initial: AsyncStorage.getItem('pb_auth'),
});
const pb = new PocketBase('http://127.0.0.1:8090', store);
```

**Constructor**: `constructor(baseURL: string, authStore?: BaseAuthStore, lang?: string)`

---

### 2.2 Authentication

#### User Authentication

```typescript
// Password authentication
const authData = await pb.collection('users').authWithPassword('email@example.com', 'password123');

// OAuth2 authentication
const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });

// Refresh auth
const authData = await pb.collection('users').authRefresh();

// Logout
pb.authStore.clear();
```

#### Admin/Superuser Authentication

```typescript
// Since PocketBase v0.23, admins are in _superusers collection
const authData = await pb.collection('_superusers').authWithPassword('admin@example.com', 'password');

// Check auth state
console.log(pb.authStore.isValid);      // boolean
console.log(pb.authStore.token);        // JWT token
console.log(pb.authStore.isSuperuser);  // boolean
```

#### Auth Store Methods

```typescript
pb.authStore.token              // Current JWT token
pb.authStore.record             // Authenticated record
pb.authStore.isValid            // Check if valid
pb.authStore.clear()            // Logout
pb.authStore.onChange(callback) // Listen to changes
```

---

### 2.3 Collections API (Schema Management)

```typescript
// Get all collections
const collections = await pb.collections.getFullList();

// Get paginated list
const result = await pb.collections.getList(1, 30);

// Get single collection
const collection = await pb.collections.getOne('collection_id_or_name');

// Create collection
const newCollection = await pb.collections.create({
    name: 'my_collection',
    type: 'base',  // 'base', 'auth', or 'view'
    fields: [
        { name: 'title', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'category', type: 'select', options: { values: ['a', 'b', 'c'] } }
    ],
    listRule: '',
    viewRule: '',
    createRule: null,
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id = "admin_id"'
});

// Update collection
const updated = await pb.collections.update('collection_id', {
    name: 'updated_name',
    fields: [...],
    listRule: 'status = "active"'
});

// Delete collection
await pb.collections.delete('collection_id');

// Truncate collection (delete all records)
await pb.collections.truncate('collection_id');
```

---

### 2.4 Records API (Data CRUD)

```typescript
// Get paginated list
const result = await pb.collection('posts').getList(1, 20, {
    filter: 'status = "published" && created >= "2024-01-01"',
    sort: '-createdAt',
    expand: 'author,category',
});

// Get all records
const records = await pb.collection('posts').getFullList({
    sort: '-createdAt',
    filter: 'status = "active"',
});

// Get single record
const post = await pb.collection('posts').getOne('RECORD_ID', {
    expand: 'author'
});

// Create record
const newRecord = await pb.collection('posts').create({
    title: 'My Post',
    content: 'Content here',
    status: 'draft',
});

// Update record
const updated = await pb.collection('posts').update('RECORD_ID', {
    title: 'Updated Title',
    status: 'published'
});

// Delete record
await pb.collection('posts').delete('RECORD_ID');
```

---

### 2.5 Query Capabilities

#### Filter Syntax

```typescript
// Equality
filter: 'status = "active"'

// Comparison
filter: 'age >= 18'
filter: 'price < 100'
filter: 'created != "2024-01-01"'

// Text search
filter: 'title ~ "hello"'  // Contains (case-insensitive)

// Null checks
filter: 'email != null'
filter: 'published = null'

// Boolean
filter: 'active = true'

// Logical operators
filter: 'status = "active" && age > 18'
filter: 'status = "draft" || status = "published"'
filter: '(status = "active" && age >= 18) || isAdmin = true'

// Using filter helper (SAFE for user input)
filter: pb.filter('title ~ {:search} && status = {:status}', 
    { search: 'hello', status: 'published' }
)
```

#### Sort Syntax

```typescript
sort: 'createdAt'       // Ascending
sort: '-createdAt'      // Descending
sort: '-createdAt,title' // Multiple fields
sort: '@random'         // Random order
```

#### Pagination

```typescript
const result = await pb.collection('posts').getList(1, 30, {
    // page: 1 (default)
    // perPage: 30 (default, max 100)
    skipTotal: true  // Skip counting for performance
});

// Response type
interface ListResult<T> {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    items: Array<T>;
}
```

#### Expand (Relations)

```typescript
expand: 'author'              // Single relation
expand: 'author,category'     // Multiple relations
expand: 'author.profile'      // Nested expansion
expand: 'author.name,email'   // Specific fields
```

---

### 2.6 File Operations

#### Upload Files

```typescript
// Using plain object (auto-converted to FormData)
const record = await pb.collection('posts').create({
    title: 'Post with image',
    cover: new File([blob], 'image.jpg', { type: 'image/jpeg' }),
    attachments: [
        new File([blob1], 'doc1.pdf'),
        new File([blob2], 'doc2.pdf')
    ]  // Multiple files
});

// Using FormData directly
const formData = new FormData();
formData.set('title', 'Post with image');
formData.set('cover', new File([blob], 'image.jpg'));

const record = await pb.collection('posts').create(formData);
```

#### Get File URL

```typescript
// Basic URL
const url = pb.files.getURL(record, 'cover');

// With thumbnail
const url = pb.files.getURL(record, 'cover', {
    thumb: '100x100',        // Thumbnail preset
    download: true,          // Force download
});

// Thumbnail presets: '100x100', '200x200', '400x400', '1000x0'
```

#### Delete Files

```typescript
// Set file field to empty string or null
await pb.collection('posts').update('RECORD_ID', {
    cover: '',  // or null
    attachments: []
});
```

---

### 2.7 User Management

```typescript
// List users
const users = await pb.collection('users').getList(1, 20, {
    filter: 'verified = true',
    sort: '-created'
});

// Get single user
const user = await pb.collection('users').getOne('user-id');

// Create user (passwordConfirm required!)
const newUser = await pb.collection('users').create({
    email: 'test@example.com',
    password: 'securePassword123',
    passwordConfirm: 'securePassword123',  // Must match!
    name: 'Test User'
});

// Update user
await pb.collection('users').update('user-id', {
    name: 'Updated Name',
    emailVisibility: true
});

// Delete user
await pb.collection('users').delete('user-id');
```

---

### 2.8 Error Handling

```typescript
import { ClientResponseError } from 'pocketbase';

try {
    const record = await pb.collection('posts').getOne('invalid-id');
} catch (error) {
    if (error instanceof ClientResponseError) {
        console.error('Status:', error.status);
        console.error('Response:', error.response);
        console.error('Is aborted:', error.isAbort);
        
        // Handle specific status codes
        if (error.status === 404) { /* Not found */ }
        else if (error.status === 401) { /* Unauthorized */ }
        else if (error.status === 403) { /* Forbidden */ }
        
        // Handle validation errors
        if (error.response?.data) {
            Object.entries(error.response.data).forEach(([field, err]) => {
                console.error(`${field}: ${err.message}`);
            });
        }
    }
}
```

**Common Status Codes**:
| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

---

### 2.9 TypeScript Types

```typescript
import PocketBase, { 
    Client,
    ClientResponseError,
    RecordService,
    RecordModel,
    ListResult
} from 'pocketbase';

// Define collection type
interface Post {
    id: string;
    title: string;
    content: string;
    status: 'draft' | 'published';
    author: string;
    created: string;
    updated: string;
    expand?: {
        author: { id: string; name: string; email: string; };
    };
}

// Use with generics for type safety
const posts = await pb.collection<Post>('posts').getList(1, 20, {
    expand: 'author'
});
// Result: Promise<ListResult<Post>>
```

---

### 2.10 Common Gotchas

#### Password Requirements
```typescript
// Creating users requires password confirmation
await pb.collection('users').create({
    email: 'test@example.com',
    password: 'securePassword123',
    passwordConfirm: 'securePassword123',  // Must match!
});
```

#### Field Name Restrictions
- Cannot start with `_` (reserved for system fields)
- Avoid JavaScript reserved words
- Use lowercase with underscores: `my_field_name`

#### Auto-Cancellation
```typescript
// SDK auto-cancels duplicate pending requests
pb.collection('posts').getList(1, 20);  // cancelled
pb.collection('posts').getList(2, 20);  // cancelled  
pb.collection('posts').getList(3, 20);  // executed

// Disable per-request
pb.collection('posts').getList(1, 20, { requestKey: null });
```

---

## 3. MCP Server Best Practices

### 3.1 Tool Naming Conventions

**✅ Do**:
- Use **snake_case**: `create_record`, `list_collections`
- Use descriptive, specific names
- Prefix related tools: `pb_create_record`, `pb_list_records`

**❌ Don't**:
- Use vague names: `search`, `get`, `do`
- Use camelCase (inconsistent with MCP ecosystem)

---

### 3.2 Tool Description Best Practices

```typescript
server.registerTool(
  'create_user',
  {
    description: 'Creates a new user in the PocketBase database. Requires authentication with admin privileges.',
    inputSchema: z.object({
      email: z.string().email().describe('User email address'),
      name: z.string().describe('Display name'),
      password: z.string().min(8).describe('Password (minimum 8 characters)')
    })
  },
  async (params) => { /* ... */ }
);
```

**Key**: Every field needs `.describe()` - this becomes LLM-readable documentation.

---

### 3.3 Input Schema Design (Zod)

```typescript
import * as z from 'zod/v4';

const CreateRecordSchema = z.object({
  collection: z
    .string()
    .regex(/^[a-z0-9_]+$/, 'Collection name must be lowercase alphanumeric')
    .describe('Collection name to create record in'),
  data: z
    .record(z.unknown())
    .describe('Record data as JSON object'),
  expand: z
    .array(z.string())
    .optional()
    .describe('Relation fields to expand')
});
```

**Best Practices**:
- Use `zod/v4` for Standard Schema support
- Always add `.describe()` to every field
- Use enums for constrained values
- Provide defaults with `.default()`
- Validate IDs with regex patterns

---

### 3.4 Tool Response Format

```typescript
// ✅ Success with data
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(records, null, 2)
    }
  ]
};

// ✅ Success with message
return {
  content: [
    { type: 'text', text: 'Created record successfully: ' + record.id }
  ]
};

// ✅ Error
return {
  content: [
    { type: 'text', text: `Failed: ${error.message}` }
  ],
  isError: true
};

// ❌ Avoid - unstructured
return { content: 'ok' };
```

---

### 3.5 Security Patterns

#### Input Validation (SQL Injection Prevention)

```typescript
// ❌ UNSAFE - SQL Injection
db.execute(`SELECT * FROM users WHERE id = '${userId}'`)

// ✅ SAFE - Parameterized + Zod validation
const UserIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{8,}$/);
const validated = UserIdSchema.parse(userId);
db.execute('SELECT * FROM users WHERE id = $1', [validated]);
```

#### Authorization Checks

```typescript
// ❌ UNSAFE - No ownership check
async function getRecord(collection, id) {
  return pb.collection(collection).getOne(id);
}

// ✅ SAFE - Enforce ownership
async function getRecord(context, collection, id) {
  const userId = context.auth?.userId;
  const record = await pb.collection(collection).getOne(id);
  
  if (record.userId !== userId && !context.auth?.isAdmin) {
    throw new Error('Unauthorized access');
  }
  return record;
}
```

#### Sensitive Data Sanitization

```typescript
// ❌ NEVER return these in responses
- admin API keys
- raw passwords
- internal system details

// ✅ ALWAYS sanitize
function sanitizeRecord(record) {
  const { password, token, ...safe } = record;
  return safe;
}
```

#### Read-Only Mode

```typescript
const READ_ONLY = process.env.PB_READ_ONLY === 'true';

server.registerTool(
  'create_record',
  {
    description: 'Creates a new record (disabled in read-only mode)',
    inputSchema: z.object({ /* ... */ })
  },
  async (params) => {
    if (READ_ONLY) {
      return {
        content: [{ type: 'text', text: 'Server is in read-only mode' }],
        isError: true
      };
    }
    // ... actual implementation
  }
);
```

---

### 3.6 Resource URI Patterns

```typescript
// Static resource
server.registerResource(
  'pb_collections',
  'pocketbase://collections',
  {
    title: 'Collections List',
    description: 'All available PocketBase collections',
    mimeType: 'application/json'
  },
  async () => { /* ... */ }
);

// Dynamic resource template
server.registerResourceTemplate(
  'pb_record',
  'pocketbase://collections/{collection}/records/{id}',
  {
    title: 'PocketBase Record',
    description: 'Individual record from a collection',
    mimeType: 'application/json'
  }
);
```

**When to Use Resources vs. Tools**:

| Use **Resources** for | Use **Tools** for |
|----------------------|------------------|
| Read-only data | Mutations/Creations/Updates |
| Static schemas | Actions that change state |
| Cached data | Complex operations |
| Configuration | User-interactive flows |

---

### 3.7 Server Architecture

```typescript
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server';

const server = new McpServer(
  {
    name: 'pocketbase-mcp',
    version: '1.0.0',
    description: 'MCP server for PocketBase database'
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    }
  }
);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down MCP server...');
  await closePocketBase();
  process.exit(0);
});

// Connect to stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## 4. Competitive Analysis

### 4.1 Overview

**8+ PocketBase MCP implementations found on GitHub.** None have Supabase MCP parity or read-only mode.

| Repository | Stars | Tools | Key Differentiator |
|------------|-------|-------|-------------------|
| mrwyndham/pocketbase-mcp | 122 ⭐ | ~10 | Most popular, clean CRUD, Docker |
| mabeldata/pocketbase-mcp | 31 ⭐ | ~25 | Best migrations, logs, cron jobs |
| DynamicEndpoints/advanced-pocketbase-mcp | ~70 ⭐ | 100+ | Full SaaS features, Cloudflare |

---

### 4.2 mrwyndham/pocketbase-mcp (122 ⭐)

**Strengths**:
- ✅ Uses correct type definitions from JS-SDK
- ✅ Tested on latest PocketBase (26.1)
- ✅ Docker support with easy configuration
- ✅ Clean, simple codebase

**Implemented Tools**:
- `create_collection`, `get_collection`
- `create_record`, `list_records`, `update_record`, `delete_record`
- `authenticate_user`, `create_user`
- `backup_database`

**Weaknesses**:
- ❌ Limited tool set (no file management API)
- ❌ No migration system
- ❌ No read-only mode support

---

### 4.3 mabeldata/pocketbase-mcp (31 ⭐)

**Strengths**:
- ✅ Best migration system
- ✅ Log and cron job APIs
- ✅ Smithery auto-install
- ✅ Detailed tool schemas with JSON descriptions

**Unique Features**:
- **Migration System**: `set_migrations_directory`, `create_migration`, `apply_migration`, `revert_migration`
- **Log Management**: `list_logs`, `get_log`, `get_logs_stats`
- **Cron Jobs**: `list_cron_jobs`, `run_cron_job`
- **File Operations**: `upload_file`, `download_file`

**Weaknesses**:
- ❌ Smaller community
- ❌ No OAuth2 or real-time subscriptions

---

### 4.4 DynamicEndpoints/advanced-pocketbase-mcp (~70 ⭐)

**Strengths**:
- ✅ Most complete feature set (100+ tools)
- ✅ Serverless-ready (Cloudflare Workers)
- ✅ Multi-transport (stdio, HTTP/SSE, Docker)
- ✅ Production error handling

**Features**:
- Full CRUD for collections + records
- Real-time subscriptions
- Email/SendGrid integration
- Stripe payment integration
- OAuth2 authentication

**Weaknesses**:
- ❌ More complex (overwhelming for simple use cases)
- ❌ Some tools reported as non-functional

---

### 4.5 Feature Comparison Matrix

| Feature | mrwyndham | mabeldata | DynamicEndpoints | **PocketBase MCP (Planned)** |
|---------|-----------|-----------|------------------|------------------------------|
| CRUD Records | ✅ | ✅ | ✅ | ✅ |
| CRUD Collections | ✅ | ✅ | ✅ | ✅ |
| User Auth | ✅ | ❌ | ✅ | ✅ |
| OAuth2 | ❌ | ❌ | ✅ | ❌ |
| File Operations | ❌ | ✅ | ✅ | ✅ |
| Real-time | ❌ | ❌ | ✅ | ❌ |
| Backup | ✅ | ❌ | ✅ | ❌ |
| Migrations | ❌ | ✅ ✅ | ✅ | ❌ |
| Logs | ❌ | ✅ | ❌ | ✅ |
| Cron Jobs | ❌ | ✅ | ❌ | ❌ |
| Email Integration | ❌ | ❌ | ✅ | ❌ |
| Stripe Payments | ❌ | ❌ | ✅ | ❌ |
| Cloudflare Worker | ❌ | ❌ | ✅ | ❌ |
| **Read-Only Mode** | ❌ | ❌ | ❌ | ✅ |
| **Supabase MCP Parity** | ❌ | ❌ | ❌ | ✅ |

---

## 5. Implementation Recommendations

### 5.1 Architecture Decision Summary

| Decision | Recommendation |
|----------|---------------|
| Server Architecture | Single unified server |
| Authentication | Admin token only |
| SDK vs. Raw HTTP | PocketBase JS SDK |
| Collections | Resources for schema + tools for CRUD |
| Connection Config | CLI args > env vars > config file |
| Feature Scope | 6 tool groups, 22 tools (Supabase MCP parity) |
| Platform Abstraction | Yes - `PocketBasePlatform` interface |
| Migrations | Skip - direct schema mutations |
| Realtime | Skip - not suitable for MCP |
| Error Handling | Wrapped errors with context |
| **Read-Only Mode** | ✅ Implement (unique feature) |

---

### 5.2 Tool Groups (22 Tools)

| Group | Tools | Read-Only Allowed |
|-------|-------|-------------------|
| **database** (5) | `list_collections`, `get_collection`, `create_collection`, `update_collection`, `delete_collection` | 2/5 |
| **records** (5) | `query_collection`, `get_record`, `create_record`, `update_record`, `delete_record` | 2/5 |
| **auth** (5) | `list_users`, `get_user`, `create_user`, `update_user`, `delete_user` | 2/5 |
| **storage** (3) | `list_files`, `upload_file`, `delete_file` | 1/3 |
| **debugging** (1) | `get_logs` | 1/1 |
| **development** (3) | `generate_typescript_types`, `get_api_url`, `get_health_status` | 3/3 |

---

### 5.3 Unique Value Propositions

Based on competitive analysis, this project will differentiate by:

1. ✅ **Read-only mode** - Safe for production databases (no existing implementation has this)
2. ✅ **Supabase MCP parity** - Familiar patterns for Supabase users
3. ✅ **Schema-aware validation** - Validate writes against collection schema before sending
4. ✅ **Clean architecture** - Learn from all 3 major implementations, avoid their mistakes
5. ✅ **Comprehensive documentation** - Tool descriptions, examples, troubleshooting

---

### 5.4 Project Structure (Recommended)

```
pocketbase-mcp/
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
│   │   ├── collection-tools.ts   # Database tools
│   │   ├── record-tools.ts       # Records CRUD
│   │   ├── auth-tools.ts         # User management
│   │   ├── storage-tools.ts      # File operations
│   │   ├── debug-tools.ts        # Logs
│   │   └── development-tools.ts  # TypeScript generation
│   └── resources/
│       └── collections.ts        # Collection schema resources
├── tests/
│   ├── platform/
│   ├── tools/
│   └── integration/
├── package.json
├── tsconfig.json
├── README.md
├── ARCHITECTURE.md
├── PLAN.md
└── RESEARCH.md  (this file)
```

---

### 5.5 Dependencies

```json
{
  "dependencies": {
    "pocketbase": "^0.21.0",
    "@modelcontextprotocol/server": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

---

### 5.6 Key Resources for Implementation

**Documentation**:
- [MCP SDK Docs](https://ts.sdk.modelcontextprotocol.io/)
- [MCP Spec](https://spec.modelcontextprotocol.io)
- [MCP Example Servers](https://github.com/modelcontextprotocol/servers)
- [PocketBase JS SDK](https://github.com/pocketbase/js-sdk)
- [PocketBase Documentation](https://pocketbase.io/docs/)

**Reference Implementations**:
- [mrwyndham/pocketbase-mcp](https://github.com/mrwyndham/pocketbase-mcp)
- [mabeldata/pocketbase-mcp](https://github.com/mabeldata/pocketbase-mcp)
- [Supabase MCP](resources/supabase-mcp/) (local reference)

---

## Summary

**Key Findings**:
1. ✅ Supabase MCP patterns validated and documented
2. ✅ PocketBase JS SDK supports all required operations
3. ✅ MCP best practices identified (security, validation, error handling)
4. ✅ Competitive landscape analyzed - **8 implementations exist but none have read-only mode or Supabase parity**

**Opportunity**: Build a PocketBase MCP that combines the best patterns from existing implementations while adding unique features: **read-only mode** and **Supabase MCP parity**.

**Next Step**: Proceed with Phase 1 (Project Setup) as defined in `PLAN.md`.
