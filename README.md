# PocketBase MCP Server

[![Build Status](https://img.shields.io/github/actions/workflow/status/Poom5741/pocketbase-vibe-mcp/test.yml)](https://github.com/Poom5741/pocketbase-vibe-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
[![Tests Passing](https://img.shields.io/badge/tests-270%20passing-green)](https://github.com/Poom5741/pocketbase-vibe-mcp)

**Full-featured Model Context Protocol (MCP) server for PocketBase** - enabling AI assistants to interact with your PocketBase instance through natural language.

## 🚀 Features

- **23 MCP Tools** across 6 categories for complete PocketBase control
- **270 Tests** - 100% test-driven development (TDD) with RED/GREEN/REFACTOR cycle
- **Read-only Mode** - Safe operation in production environments
- **Smart Configuration** - CLI args, env vars, or config files with priority resolution
- **Comprehensive Error Handling** - Type-safe errors with retryable detection
- **TypeScript Strict Mode** - Zero type errors, full type safety

## 🛠️ Tool Categories

### 📊 Collections (5 tools)
Manage your database schemas:
- `list_collections` - List all collection schemas
- `get_collection` - Get single collection schema
- `create_collection` - Create new collection ⚠️ 
- `update_collection` - Update collection schema ⚠️ 
- `delete_collection` - Delete collection ⚠️ 

### 📝 Records (5 tools)
CRUD operations for your data:
- `query_collection` - Query records with filters and pagination
- `get_record` - Get single record by ID
- `create_record` - Create new record ⚠️ 
- `update_record` - Update record ⚠️ 
- `delete_record` - Delete record ⚠️ 

### 🔐 Authentication (5 tools)
User management:
- `list_users` - List users with pagination
- `get_user` - Get single user
- `create_user` - Create new user ⚠️ 
- `update_user` - Update user ⚠️ 
- `delete_user` - Delete user ⚠️ 

### 📁 Storage (3 tools)
File operations:
- `list_files` - List files attached to record
- `upload_file` - Upload file to record ⚠️ 
- `delete_file` - Delete file from record ⚠️ 

### 🔍 Debugging (1 tool)
- `get_logs` - Retrieve PocketBase instance logs

### 🛠️ Development (3 tools)
Developer utilities:
- `generate_typescript_types` - Generate TypeScript SDK types from collections
- `get_api_url` - Get API base URL
- `get_health_status` - Check instance health

## ⚡ Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- PocketBase instance (local or remote)
- Admin token from PocketBase dashboard

### Installation

```bash
npm install
npm run build
```

### Configuration

Create `~/.pocketbase-mcp.json`:

```json
{
  "url": "http://localhost:8090",
  "adminToken": "your-admin-token-here",
  "readOnly": false
}
```

### Usage with PocketBase

```bash
# Using config file
npm start

# Using environment variables
POCKETBASE_URL=http://localhost:8090 \
POCKETBASE_ADMIN_TOKEN=your-token \
npm start

# Using CLI arguments
npm start -- --url http://localhost:8090 --admin-token your-token

# Read-only mode (safe for production)
npm start -- --url http://localhost:8090 --admin-token your-token --readonly
```

### Integration with Claude

Add to your Claude Code configuration:

```bash
# ~/.config/claude-code/config.json or project-specific
{
  "mcpServers": {
    "pocketbase": {
      "command": "npm",
      "args": ["start", "--prefix", "/Users/you/pocketbase-vibe-mcp"],
      "env": {
        "POCKETBASE_URL": "http://localhost:8090",
        "POCKETBASE_ADMIN_TOKEN": "your-token"
      }
    }
  }
}
```

## 🎯 Example Operations

**"Show me all collections in my PocketBase"**
→ Claude will use `list_collections` tool

**"Create a new users collection with email and name fields"**
→ Claude will use `create_collection` tool with schema definitions

**"Find all users created in the last 24 hours"**
→ Claude will use `query_collection` with appropriate filter

**"Generate TypeScript types for my current collections"**
→ Claude will use `generate_typescript_types` tool

## 🔧 Configuration Options

### Priority Order
1. **CLI arguments** (highest priority)
2. **Environment variables**
3. **Config files** (lowest priority)

Available configuration:

| Source | Field | Example |
|--------|-------|---------|
| CLI | `--url` | `http://localhost:8090` |
| CLI | `--admin-token` | `your-token` |
| CLI | `--readonly` | (flag, no value needed) |
| Env | `POCKETBASE_URL` | `http://localhost:8090` |
| Env | `POCKETBASE_ADMIN_TOKEN` | `your-token` |
| Env | `POCKETBASE_READONLY` | `true`, `false`, `1`, `0` |
| Config | `url`, `adminToken`, `readOnly` | JSON object |

## ✅ Testing

Run all tests:

```bash
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

Integration tests (requires Docker):

```bash
npm run test:integration
```

### Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Project Setup | 29 | ✅ Passing |
| Configuration | 36 | ✅ Passing |
| Platform Abstraction | 140 | ✅ Passing |
| Tool Implementations | 65 | ✅ Passing |
| **Total** | **270** | **✅ All Passing** |

## 🔒 Security

### ⚠️ Important Warnings

This MCP server is for **development environments only**:

- Uses admin tokens with **full PocketBase access**
- Should **NEVER** be:
  - Exposed to untrusted networks
  - Run in production environments (unless read-only)
  - Used with production data without read-only mode

### Best Practices

1. **Use separate instances** for development and production
2. **Enable read-only mode** for production testing
3. **Rotate admin tokens** regularly
4. **Never commit config files** with tokens (they're in .gitignore)
5. **Use minimal-privilege users** when possible

## 📚 Error Handling

PocketBase MCP provides structured error types:

| Error Type | Description | Retryable |
|------------|-------------|-----------|
| `NOT_FOUND` | Resource doesn't exist (404) | ❌ |
| `VALIDATION_ERROR` | Invalid input (400) | ❌ |
| `AUTH_ERROR` | Token invalid/expired (401) | ❌ |
| `PERMISSION_DENIED` | Insufficient permissions (403) | ❌ |
| `NETWORK_ERROR` | Connection issues | ✅ |
| `RATE_LIMITED` | Too many requests (429) | ✅ |
| `SERVER_ERROR` | PocketBase server error (5xx) | ✅ |
| `TIMEOUT_ERROR` | Request timeout | ✅ |

Retryable errors are automatically flagged for retry with exponential backoff.

## 🏗️ Architecture

```
src/
├── index.ts              # CLI entry point
├── server.ts             # MCP server setup
├── config.ts             # Configuration layer
├── errors.ts             # Error handling
├── platform/
│   ├── types.ts          # Operation interfaces
│   ├── readonly.ts       # Read-only enforcement
│   └── sdk-platform.ts   # SDK abstraction
├── tools/
│   ├── collection-tools.ts   # 5 collection tools
│   ├── record-tools.ts       # 5 record tools
│   ├── auth-tools.ts         # 5 auth tools
│   ├── storage-tools.ts      # 3 storage tools
│   ├── debug-tools.ts        # 1 debug tool
│   └── development-tools.ts  # 3 dev tools
└── resources/
    └── collections.ts    # MCP resources
```

## 🧪 Test-Driven Development

All features developed using TDD:

1. **RED** - Write test specification first
2. **GREEN** - Implement to make tests pass
3. **REFACTOR** - Optimize and clean up

Each commit follows the TDD cycle and includes tests. This ensures 100% code coverage and reliability.

## 📦 Dependencies

### Runtime

- `@modelcontextprotocol/server` - Official MCP TypeScript SDK
- `pocketbase` - Official PocketBase JavaScript SDK
- `zod` - Schema validation

### Development

- `typescript` - Type safety
- `vitest` - Testing framework
- `tsx` - TypeScript execution
- `eslint` - Code quality
- `prettier` - Code formatting

## 📋 Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- PocketBase >= 0.21.0
- Vitest >= 1.0.0

## 🗺️ Roadmap

### Future Enhancements

- [ ] Multiple connection profiles
- [ ] OAuth/user token authentication
- [ ] Migration history tracking
- [ ] Plugin/extension system
- [ ] Realtime subscriptions (WebSocket)
- [ ] Advanced query builder
- [ ] Caching layer
- [ ] Performance metrics/telemetry

### Out of Scope (Not Planned)

- Webhook management
- Backup/restore operations
- Multi-tenant support

## 🤝 Contributing

Contributions welcome! Please:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Write tests** following TDD (RED/GREEN/REFACTOR)
4. **Ensure** all 270 tests pass
5. **Commit** with clear messages
6. **Open** a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase MCP](https://github.com/supabase-community/mcp-server-supabase) - Inspiration and reference implementation
- [PocketBase](https://pocketbase.io) - Amazing backend framework
- [Model Context Protocol](https://modelcontextprotocol.io) - AI integration standard

## 📞 Support

- **Issues**: Open a GitHub issue
- **Discussions**: GitHub Discussions tab
- **Examples**: Check the `resources/supabase-mcp` directory for patterns

---

**Built with ❤️ using Test-Driven Development**

[🐛 Report Bug](https://github.com/Poom5741/pocketbase-vibe-mcp/issues) · [💡 Request Feature](https://github.com/Poom5741/pocketbase-vibe-mcp/issues)
