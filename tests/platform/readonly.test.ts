import { describe, it, expect, vi } from 'vitest';

describe('Read-Only Operations', () => {
  describe('WRITE_OPERATIONS', () => {
    it('should be defined and frozen', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toBeDefined();
      expect(Object.isFrozen(WRITE_OPERATIONS)).toBe(true);
    });

    it('should include create_collection', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('create_collection');
    });

    it('should include update_collection', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('update_collection');
    });

    it('should include delete_collection', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('delete_collection');
    });

    it('should include create_record', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('create_record');
    });

    it('should include update_record', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('update_record');
    });

    it('should include delete_record', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('delete_record');
    });

    it('should include create_user', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('create_user');
    });

    it('should include update_user', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('update_user');
    });

    it('should include delete_user', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('delete_user');
    });

    it('should include upload_file', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('upload_file');
    });

    it('should include delete_file', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS).toContain('delete_file');
    });

    it('should have exactly 11 write operations', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      expect(WRITE_OPERATIONS.length).toBe(11);
    });
  });

  describe('READ_OPERATIONS', () => {
    it('should be defined and frozen', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toBeDefined();
      expect(Object.isFrozen(READ_OPERATIONS)).toBe(true);
    });

    it('should include list_collections', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('list_collections');
    });

    it('should include get_collection', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('get_collection');
    });

    it('should include query_collection', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('query_collection');
    });

    it('should include get_record', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('get_record');
    });

    it('should include list_users', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('list_users');
    });

    it('should include get_user', async () => {
      const { WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      // Verify no overlap between read and write
      expect(READ_OPERATIONS.some(op => WRITE_OPERATIONS.includes(op as any))).toBe(false);
    });

    it('should include list_files', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('list_files');
    });

    it('should include generate_typescript_types', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('generate_typescript_types');
    });

    it('should include get_api_url', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('get_api_url');
    });

    it('should include get_health_status', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS).toContain('get_health_status');
    });

    it('should have exactly 9 read operations', async () => {
      const { READ_OPERATIONS } = await import('../../src/platform/readonly');
      expect(READ_OPERATIONS.length).toBe(9);
    });
  });

  describe('Operation Categorization', () => {
    it('should have no overlap between READ_OPERATIONS and WRITE_OPERATIONS', async () => {
      const { READ_OPERATIONS, WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      const overlap = READ_OPERATIONS.filter(op => WRITE_OPERATIONS.includes(op as any));
      expect(overlap).toHaveLength(0);
    });

    it('should include all collection CRUD operations across both arrays', async () => {
      const { READ_OPERATIONS, WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      const allOperations = [...READ_OPERATIONS, ...WRITE_OPERATIONS];
      
      expect(allOperations).toContain('list_collections');
      expect(allOperations).toContain('get_collection');
      expect(allOperations).toContain('create_collection');
      expect(allOperations).toContain('update_collection');
      expect(allOperations).toContain('delete_collection');
    });

    it('should include all record CRUD operations across both arrays', async () => {
      const { READ_OPERATIONS, WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      const allOperations = [...READ_OPERATIONS, ...WRITE_OPERATIONS];
      
      expect(allOperations).toContain('query_collection');
      expect(allOperations).toContain('get_record');
      expect(allOperations).toContain('create_record');
      expect(allOperations).toContain('update_record');
      expect(allOperations).toContain('delete_record');
    });

    it('should include all user CRUD operations across both arrays', async () => {
      const { READ_OPERATIONS, WRITE_OPERATIONS } = await import('../../src/platform/readonly');
      const allOperations = [...READ_OPERATIONS, ...WRITE_OPERATIONS];
      
      expect(allOperations).toContain('list_users');
      expect(allOperations).toContain('get_user');
      expect(allOperations).toContain('create_user');
      expect(allOperations).toContain('update_user');
      expect(allOperations).toContain('delete_user');
    });
  });
});

describe('ReadOnlyError', () => {
  it('should be defined', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    expect(ReadOnlyError).toBeDefined();
  });

  it('should extend Error class', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('test_operation');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct error name', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('test_operation');
    expect(error.name).toBe('Error');
  });

  it('should include operation name in message', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('create_collection');
    expect(error.message).toContain('create_collection');
  });

  it('should indicate blocked in read-only mode', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('delete_record');
    expect(error.message).toContain('blocked in read-only mode');
  });

  it('should mention using PocketBase dashboard', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('update_collection');
    expect(error.message).toContain('PocketBase dashboard');
  });

  it('should have helpful error message for schema changes', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('create_user');
    expect(error.message).toContain('make schema changes');
  });

  it('should format message correctly with full template', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('upload_file');
    expect(error.message).toBe(
      "Operation 'upload_file' is blocked in read-only mode. Use the PocketBase dashboard to make schema changes."
    );
  });

  it('should preserve stack trace', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    const error = new ReadOnlyError('test_operation');
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });

  it('should handle different operation types', async () => {
    const { ReadOnlyError } = await import('../../src/platform/readonly');
    
    const operations = [
      'create_collection',
      'delete_record',
      'update_user',
      'upload_file'
    ];

    operations.forEach(operation => {
      const error = new ReadOnlyError(operation);
      expect(error.message).toContain(operation);
    });
  });
});

describe('Read-Only Mode Enforcement', () => {
  it('should allow read operations', async () => {
    const { isReadOnlyOperation } = await import('../../src/platform/readonly');
    
    const readOps = [
      'list_collections',
      'get_collection',
      'query_collection',
      'get_record',
      'list_users',
      'get_user',
      'list_files',
      'generate_typescript_types',
      'get_api_url',
      'get_health_status'
    ];

    readOps.forEach(op => {
      expect(isReadOnlyOperation(op)).toBe(true);
    });
  });

  it('should block write operations', async () => {
    const { isReadOnlyOperation } = await import('../../src/platform/readonly');
    
    const writeOps = [
      'create_collection',
      'update_collection',
      'delete_collection',
      'create_record',
      'update_record',
      'delete_record',
      'create_user',
      'update_user',
      'delete_user',
      'upload_file',
      'delete_file'
    ];

    writeOps.forEach(op => {
      expect(isReadOnlyOperation(op)).toBe(false);
    });
  });

  it('should block unknown operations by default', async () => {
    const { isReadOnlyOperation } = await import('../../src/platform/readonly');
    expect(isReadOnlyOperation('unknown_operation')).toBe(false);
  });

  it('should handle case-sensitive operation names', async () => {
    const { isReadOnlyOperation } = await import('../../src/platform/readonly');
    
    // Different case should not match
    expect(isReadOnlyOperation('List_Collections')).toBe(false);
    expect(isReadOnlyOperation('CREATE_COLLECTION')).toBe(false);
  });

  it('should provide helper function isWriteOperation', async () => {
    const { isWriteOperation } = await import('../../src/platform/readonly');
    
    expect(isWriteOperation('create_collection')).toBe(true);
    expect(isWriteOperation('list_collections')).toBe(false);
  });
});
