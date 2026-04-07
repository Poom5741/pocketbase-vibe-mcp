# PocketBase MCP Tool Specifications

## Overview

This document defines all tools with signatures, descriptions, and input/output schemas matching Supabase MCP parity.

---

## Tool Group 1: Database (Collections)

### `list_collections`

**Supabase Equivalent**: `list_tables`

**Description**: List all collection schemas in the PocketBase instance. Returns collection definitions including fields, indexes, and settings.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "expand": {
      "type": "boolean",
      "description": "Include additional collection metadata (default: false)"
    }
  }
}
```

**Output**:
```typescript
{
  collections: Collection[]
}

interface Collection {
  id: string;
  name: string;
  type: 'base' | 'auth' | 'view' | 'alias';
  schema: Field[];
  indexes: string[];
  listRule: string | null;
  viewRule: string | null;
  createRule: string | null;
  updateRule: string | null;
  deleteRule: string | null;
}
```

**Example**:
```typescript
const result = await list_collections({ expand: false });
// Returns: { collections: [{ name: 'users', type: 'auth', schema: [...] }, ...] }
```

**Read-Only**: ✅ Allowed

---

### `get_collection`

**Supabase Equivalent**: N/A (schema inspection)

**Description**: Get detailed schema definition for a specific collection.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Collection name or ID"
    }
  },
  "required": ["name"]
}
```

**Output**: Single `Collection` object

**Example**:
```typescript
const users = await get_collection({ name: 'users' });
// Returns: { id: '...', name: 'users', type: 'auth', ... }
```

**Read-Only**: ✅ Allowed

---

### `create_collection`

**Supabase Equivalent**: `apply_migration` (CREATE TABLE)

**Description**: Create a new collection with the specified schema.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Collection name (lowercase, alphanumeric, underscores)"
    },
    "type": {
      "type": "string",
      "enum": ["base", "auth", "view", "alias"],
      "description": "Collection type"
    },
    "schema": {
      "type": "array",
      "description": "Field definitions",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string", "enum": ["text", "number", "bool", "email", "url", "date", "select", "json", "relation", "file"] },
          "required": { "type": "boolean" },
          "unique": { "type": "boolean" },
          "options": { "type": "object" }
        }
      }
    },
    "indexes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Index definitions"
    }
  },
  "required": ["name", "type", "schema"]
}
```

**Output**: Created `Collection` object

**Read-Only**: ❌ Blocked (destructive)

**Warning**: This operation is irreversible via MCP. Use `delete_collection` to remove.

---

### `update_collection`

**Supabase Equivalent**: `apply_migration` (ALTER TABLE)

**Description**: Update an existing collection's schema, fields, or rules.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Collection name to update"
    },
    "schema": {
      "type": "object",
      "description": "Fields to update (partial collection schema)",
      "properties": {
        "name": { "type": "string" },
        "listRule": { "type": "string" },
        "viewRule": { "type": "string" },
        "createRule": { "type": "string" },
        "updateRule": { "type": "string" },
        "deleteRule": { "type": "string" },
        "schema": { "type": "array" }
      }
    }
  },
  "required": ["name", "schema"]
}
```

**Output**: Updated `Collection` object

**Read-Only**: ❌ Blocked (destructive)

**Warning**: Deleting fields will cause data loss for those fields.

---

### `delete_collection`

**Supabase Equivalent**: `apply_migration` (DROP TABLE)

**Description**: Delete a collection and all its records.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Collection name or ID to delete"
    }
  },
  "required": ["name"]
}
```

**Output**: `{ success: true, deleted: string }`

**Read-Only**: ❌ Blocked (destructive)

**Warning**: ⚠️ PERMANENT - All records in the collection will be deleted. This cannot be undone.

---

## Tool Group 2: Records (Data CRUD)

### `query_collection`

**Supabase Equivalent**: `execute_sql` (SELECT)

**Description**: Query records from a collection with filtering, sorting, and pagination.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": {
      "type": "string",
      "description": "Collection name to query"
    },
    "filter": {
      "type": "string",
      "description": "Filter expression (e.g., 'status = \"active\" && age > 18')"
    },
    "sort": {
      "type": "string",
      "description": "Sort field (prefix with - for descending, e.g., '-createdAt')"
    },
    "page": {
      "type": "number",
      "description": "Page number (1-indexed, default: 1)"
    },
    "perPage": {
      "type": "number",
      "description": "Records per page (default: 100, max: 500)"
    },
    "expand": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Relation fields to expand"
    }
  },
  "required": ["collection"]
}
```

**Output**:
```typescript
{
  items: Record[],
  totalPages: number,
  totalItems: number,
  page: number,
  perPage: number
}
```

**Example**:
```typescript
const users = await query_collection({
  collection: 'users',
  filter: 'verified = true',
  sort: '-createdAt',
  page: 1,
  perPage: 50
});
```

**Read-Only**: ✅ Allowed

---

### `get_record`

**Supabase Equivalent**: `execute_sql` (SELECT WHERE id = ...)

**Description**: Get a single record by ID.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": {
      "type": "string",
      "description": "Collection name"
    },
    "id": {
      "type": "string",
      "description": "Record ID"
    },
    "expand": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Relation fields to expand"
    }
  },
  "required": ["collection", "id"]
}
```

**Output**: Single `Record` object

**Read-Only**: ✅ Allowed

---

### `create_record`

**Supabase Equivalent**: `execute_sql` (INSERT)

**Description**: Create a new record in a collection.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": {
      "type": "string",
      "description": "Collection name"
    },
    "data": {
      "type": "object",
      "description": "Record data (key-value pairs matching schema fields)"
    }
  },
  "required": ["collection", "data"]
}
```

**Output**: Created `Record` object

**Read-Only**: ❌ Blocked (destructive)

---

### `update_record`

**Supabase Equivalent**: `execute_sql` (UPDATE)

**Description**: Update an existing record.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": {
      "type": "string",
      "description": "Collection name"
    },
    "id": {
      "type": "string",
      "description": "Record ID"
    },
    "data": {
      "type": "object",
      "description": "Fields to update (partial data)"
    }
  },
  "required": ["collection", "id", "data"]
}
```

**Output**: Updated `Record` object

**Read-Only**: ❌ Blocked (destructive)

---

### `delete_record`

**Supabase Equivalent**: `execute_sql` (DELETE)

**Description**: Delete a record.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": {
      "type": "string",
      "description": "Collection name"
    },
    "id": {
      "type": "string",
      "description": "Record ID"
    }
  },
  "required": ["collection", "id"]
}
```

**Output**: `{ success: true, deleted: string }`

**Read-Only**: ❌ Blocked (destructive)

---

## Tool Group 3: Auth (User Management)

### `list_users`

**Description**: List user accounts from the auth collection.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "filter": {
      "type": "string",
      "description": "Filter expression"
    },
    "sort": {
      "type": "string",
      "description": "Sort field"
    },
    "page": { "type": "number" },
    "perPage": { "type": "number" }
  }
}
```

**Output**: Paginated list of users

**Read-Only**: ✅ Allowed

---

### `get_user`

**Description**: Get a specific user by ID.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "User ID"
    }
  },
  "required": ["id"]
}
```

**Output**: Single user object

**Read-Only**: ✅ Allowed

---

### `create_user`

**Description**: Create a new user account.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "email": { "type": "string" },
    "password": { "type": "string" },
    "passwordConfirm": { "type": "string" },
    "emailVisibility": { "type": "boolean" },
    "data": {
      "type": "object",
      "description": "Additional user data fields"
    }
  },
  "required": ["email", "password"]
}
```

**Output**: Created user object

**Read-Only**: ❌ Blocked

---

### `update_user`

**Description**: Update a user account.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "email": { "type": "string" },
    "password": { "type": "string" },
    "emailVisibility": { "type": "boolean" },
    "data": { "type": "object" }
  },
  "required": ["id"]
}
```

**Output**: Updated user object

**Read-Only**: ❌ Blocked

---

### `delete_user`

**Description**: Delete a user account.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" }
  },
  "required": ["id"]
}
```

**Output**: `{ success: true, deleted: string }`

**Read-Only**: ❌ Blocked

---

## Tool Group 4: Storage (Files)

### `list_files`

**Supabase Equivalent**: `list_storage_buckets` + list objects

**Description**: List files attached to a record.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": { "type": "string" },
    "recordId": { "type": "string" },
    "field": { "type": "string", "description": "File field name (default: first file field)" }
  },
  "required": ["collection", "recordId"]
}
```

**Output**: List of file metadata

**Read-Only**: ✅ Allowed

---

### `upload_file`

**Description**: Upload a file to a record's file field.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": { "type": "string" },
    "recordId": { "type": "string" },
    "field": { "type": "string" },
    "file": {
      "type": "string",
      "description": "Base64 encoded file or file path"
    },
    "fileName": { "type": "string" }
  },
  "required": ["collection", "recordId", "field", "file"]
}
```

**Output**: Uploaded file metadata

**Read-Only**: ❌ Blocked

---

### `delete_file`

**Description**: Delete a file from a record.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": { "type": "string" },
    "recordId": { "type": "string" },
    "field": { "type": "string" },
    "fileName": { "type": "string" }
  },
  "required": ["collection", "recordId", "field", "fileName"]
}
```

**Output**: `{ success: true, deleted: string }`

**Read-Only**: ❌ Blocked

---

## Tool Group 5: Debugging

### `get_logs`

**Supabase Equivalent**: `get_logs`

**Description**: Get instance logs for debugging.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "level": {
      "type": "string",
      "enum": ["debug", "info", "warn", "error"],
      "description": "Filter by log level"
    },
    "limit": {
      "type": "number",
      "description": "Number of logs to return (default: 50)"
    }
  }
}
```

**Output**:
```typescript
{
  logs: LogEntry[]
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}
```

**Read-Only**: ✅ Allowed

---

## Tool Group 6: Development

### `generate_typescript_types`

**Supabase Equivalent**: `generate_typescript_types`

**Description**: Generate TypeScript type definitions for all collections.

**Input Schema**: `{}` (no parameters)

**Output**:
```typescript
{
  types: string
}

// Example output:
// export type Collections = {
//   users: { id: string; email: string; ... };
//   posts: { id: string; title: string; ... };
// };
```

**Read-Only**: ✅ Allowed

---

### `get_api_url`

**Description**: Get the base API URL for the PocketBase instance.

**Input Schema**: `{}`

**Output**:
```typescript
{
  url: string,
  adminUrl: string
}
```

**Read-Only**: ✅ Allowed

---

### `get_health_status`

**Description**: Check PocketBase instance health and version.

**Input Schema**: `{}`

**Output**:
```typescript
{
  healthy: boolean;
  version: string;
  uptime: number;
}
```

**Read-Only**: ✅ Allowed

---

## Tool Summary

| Group | Tools | Read-Only Allowed |
|-------|-------|-------------------|
| **database** | 5 | 2/5 |
| **records** | 5 | 2/5 |
| **auth** | 5 | 2/5 |
| **storage** | 3 | 1/3 |
| **debugging** | 1 | 1/1 |
| **development** | 3 | 3/3 |
| **TOTAL** | **22** | **11/22** |

---

## Error Responses

All tools return consistent error format:

```typescript
// Success
{
  success: true,
  data: T
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}

// Read-Only Block
{
  success: false,
  error: {
    code: 'READ_ONLY_MODE',
    message: "Operation 'create_collection' is blocked in read-only mode. Use the PocketBase dashboard to make schema changes.",
    dashboardUrl: string
  }
}
```

---

## Supabase MCP Parity Analysis

| Supabase Tool | PocketBase Equivalent | Notes |
|---------------|----------------------|-------|
| `list_tables` | `list_collections` | ✅ Direct |
| `execute_sql` | `query_collection` + CRUD | ✅ Split into typed operations |
| `apply_migration` | `create/update_collection` | ⚠️ No migration history |
| `list_migrations` | N/A | ❌ Not applicable |
| `create_project` | N/A | ❌ Single instance |
| `get_logs` | `get_logs` | ✅ Direct |
| `generate_typescript_types` | `generate_typescript_types` | ✅ Direct |
| `list_storage_buckets` | `list_files` | ✅ Via file: file collections |

**Parity Score**: ~85% (missing multi-project and migration history, which don't apply to PocketBase)
