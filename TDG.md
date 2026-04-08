# Test-Driven Generation Configuration

## Project Information

- **Name**: PocketBase MCP Server
- **Description**: MCP server for PocketBase with feature parity to Supabase MCP
- **Technology Stack**: TypeScript, Node.js

## Testing Framework

- **Framework**: Vitest
- **Test Command**: `npm test` (runs `vitest`)
- **Watch Mode**: `npm run test:watch`
- **Integration Tests**: `npm run test:integration`
- **Coverage**: Built-in Vitest coverage

## Build System

- **Build Command**: `npm run build` (runs `tsc`)
- **Dev Command**: `npm run dev` (runs `tsx src/index.ts`)
- **Start Command**: `npm start` (runs `node dist/index.js`)
- **TypeScript Config**: `tsconfig.json`

## Running Tests

```bash
# Run all tests
npm test

# Run single test file
npm test -- src/path/to/file.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Integration tests (requires Docker)
npm run test:integration
```

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── server.ts             # MCP server setup
├── config.ts             # Configuration layer
├── types.ts              # Shared types
├── errors.ts             # Error handling
├── platform/             # Platform abstraction
│   ├── types.ts
│   ├── readonly.ts
│   └── sdk-platform.ts
├── tools/                # MCP tools
│   ├── collection-tools.ts
│   ├── record-tools.ts
│   ├── auth-tools.ts
│   ├── storage-tools.ts
│   ├── debug-tools.ts
│   └── development-tools.ts
└── resources/            # MCP resources
    └── collections.ts

tests/
├── platform/
├── tools/
└── integration/
```

## Dependencies

- `@modelcontextprotocol/server`: Official MCP TypeScript SDK
- `pocketbase`: Official PocketBase JavaScript SDK
- `zod`: Schema validation

## Key Conventions

- Use ES2022 modules
- Strict TypeScript mode enabled
- ESM output (`"module": "ES2022"`)
- All list operations support pagination (page, perPage, sort, filter)
- Read-only mode blocks write operations
- Error taxonomy with specific error types

## TDD Cycle

This project follows the TDD cycle:
1. **RED**: Write test specification (commit with "red:" prefix)
2. **GREEN**: Implement code to pass tests (commit with "green:" prefix)
3. **REFACTOR**: Optimize and clean up (commit with "refactor:" prefix)
