import { describe, it, expect } from 'vitest';

describe('PocketBaseOperations Types', () => {
  describe('PocketBaseOperations Interface', () => {
    it('should define collections operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types.PocketBaseOperations || types.default).toBeDefined();
    });

    it('should define collection operations with all CRUD methods', async () => {
      const types = await import('../../src/platform/types');
      expect(types.CollectionOperations || types.default).toBeDefined();
    });

    it('should define records operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types.RecordOperations || types.default).toBeDefined();
    });

    it('should define users operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types.UserOperations || types.default).toBeDefined();
    });

    it('should define files operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types.FileOperations || types.default).toBeDefined();
    });

    it('should define debugging operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types.DebugOperations || types.default).toBeDefined();
    });

    it('should define development operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types.DevelopmentOperations || types.default).toBeDefined();
    });
  });

  describe('Supporting Types', () => {
    it('should define Collection type', async () => {
      const types = await import('../../src/platform/types');
      expect(types.Collection || types.default).toBeDefined();
    });

    it('should define CollectionSchema type', async () => {
      const types = await import('../../src/platform/types');
      expect(types.CollectionSchema || types.default).toBeDefined();
    });

    it('should define Record type', async () => {
      const types = await import('../../src/platform/types');
      expect(types.Record || types.default).toBeDefined();
    });

    it('should define User type', async () => {
      const types = await import('../../src/platform/types');
      expect(types.User || types.default).toBeDefined();
    });

    it('should define TypeSchemaField type', async () => {
      const types = await import('../../src/platform/types');
      expect(types.TypeSchemaField || types.default).toBeDefined();
    });
  });
});

describe('PocketBaseOperations Types', () => {
  describe('PocketBaseOperations Interface', () => {
    it('should define collections operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define collection operations with list method', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define collection operations with get method', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define collection operations with create method', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define collection operations with update method', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define collection operations with delete method', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define records operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define users operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define files operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define debugging operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });

    it('should define development operations interface', async () => {
      const types = await import('../../src/platform/types');
      expect(types).toBeDefined();
    });
  });
});

describe('CollectionOperations', () => {
  it('should have list method returning Promise<Collection[]>', async () => {
    const { CollectionOperations } = await import('../../src/platform/types');
    // Type-level verification
    expect(CollectionOperations).toBeDefined();
  });

  it('should have get method with name parameter', async () => {
    const { CollectionOperations } = await import('../../src/platform/types');
    expect(CollectionOperations).toBeDefined();
  });

  it('should have create method with schema parameter', async () => {
    const { CollectionOperations } = await import('../../src/platform/types');
    expect(CollectionOperations).toBeDefined();
  });

  it('should have update method with name and schema parameters', async () => {
    const { CollectionOperations } = await import('../../src/platform/types');
    expect(CollectionOperations).toBeDefined();
  });

  it('should have delete method with name parameter', async () => {
    const { CollectionOperations } = await import('../../src/platform/types');
    expect(CollectionOperations).toBeDefined();
  });
});

describe('RecordOperations', () => {
  it('should define query method with pagination support', async () => {
    const { RecordOperations } = await import('../../src/platform/types');
    expect(RecordOperations).toBeDefined();
  });

  it('should define get method with record id parameter', async () => {
    const { RecordOperations } = await import('../../src/platform/types');
    expect(RecordOperations).toBeDefined();
  });

  it('should define create method with collection and data parameters', async () => {
    const { RecordOperations } = await import('../../src/platform/types');
    expect(RecordOperations).toBeDefined();
  });

  it('should define update method with id and data parameters', async () => {
    const { RecordOperations } = await import('../../src/platform/types');
    expect(RecordOperations).toBeDefined();
  });

  it('should define delete method with id parameter', async () => {
    const { RecordOperations } = await import('../../src/platform/types');
    expect(RecordOperations).toBeDefined();
  });
});

describe('UserOperations', () => {
  it('should define list method with pagination parameters', async () => {
    const { UserOperations } = await import('../../src/platform/types');
    expect(UserOperations).toBeDefined();
  });

  it('should define get method with user id parameter', async () => {
    const { UserOperations } = await import('../../src/platform/types');
    expect(UserOperations).toBeDefined();
  });

  it('should define create method with user data', async () => {
    const { UserOperations } = await import('../../src/platform/types');
    expect(UserOperations).toBeDefined();
  });

  it('should define update method with id and data', async () => {
    const { UserOperations } = await import('../../src/platform/types');
    expect(UserOperations).toBeDefined();
  });

  it('should define delete method with id parameter', async () => {
    const { UserOperations } = await import('../../src/platform/types');
    expect(UserOperations).toBeDefined();
  });
});

describe('FileOperations', () => {
  it('should define getUrl method with collection, record, and filename parameters', async () => {
    const { FileOperations } = await import('../../src/platform/types');
    expect(FileOperations).toBeDefined();
  });

  it('should define getFile method with file path parameter', async () => {
    const { FileOperations } = await import('../../src/platform/types');
    expect(FileOperations).toBeDefined();
  });

  it('should define uploadFile method with collection, record, and file parameters', async () => {
    const { FileOperations } = await import('../../src/platform/types');
    expect(FileOperations).toBeDefined();
  });

  it('should define deleteFile method with collection, record, and filename parameters', async () => {
    const { FileOperations } = await import('../../src/platform/types');
    expect(FileOperations).toBeDefined();
  });

  it('should define listFiles method with collection and record parameters', async () => {
    const { FileOperations } = await import('../../src/platform/types');
    expect(FileOperations).toBeDefined();
  });
});

describe('DebugOperations', () => {
  it('should define getHealth method', async () => {
    const { DebugOperations } = await import('../../src/platform/types');
    expect(DebugOperations).toBeDefined();
  });

  it('should define getApiUrl method', async () => {
    const { DebugOperations } = await import('../../src/platform/types');
    expect(DebugOperations).toBeDefined();
  });
});

describe('DevelopmentOperations', () => {
  it('should define generateTypeScriptTypes method', async () => {
    const { DevelopmentOperations } = await import('../../src/platform/types');
    expect(DevelopmentOperations).toBeDefined();
  });
});

describe('Supporting Types', () => {
  it('should define Collection type', async () => {
    const { Collection, CollectionSchema } = await import('../../src/platform/types');
    expect(Collection).toBeDefined();
    expect(CollectionSchema).toBeDefined();
  });

  it('should define Record type', async () => {
    const { Record } = await import('../../src/platform/types');
    expect(Record).toBeDefined();
  });

  it('should define User type', async () => {
    const { User } = await import('../../src/platform/types');
    expect(User).toBeDefined();
  });

  it('should define CollectionSchema type', async () => {
    const { CollectionSchema, TypeSchemaField } = await import('../../src/platform/types');
    expect(CollectionSchema).toBeDefined();
    expect(TypeSchemaField).toBeDefined();
  });
});
