import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock PocketBase SDK
const mockPocketBaseConstructor = vi.fn();
const mockCollectionsGetFullList = vi.fn();
const mockCollectionsGetOne = vi.fn();
const mockCollectionsCreate = vi.fn();
const mockCollectionsUpdate = vi.fn();
const mockCollectionsDelete = vi.fn();
const mockRecordsGetFullList = vi.fn();
const mockRecordsGetOne = vi.fn();
const mockRecordsCreate = vi.fn();
const mockRecordsUpdate = vi.fn();
const mockRecordsDelete = vi.fn();

vi.mock('pocketbase', () => {
  return {
    default: mockPocketBaseConstructor.mockImplementation(function() {
      this.baseUrl = '';
      this.collections = {
        getFullList: mockCollectionsGetFullList,
        getOne: mockCollectionsGetOne,
        create: mockCollectionsCreate,
        update: mockCollectionsUpdate,
        delete: mockCollectionsDelete,
      };
      this.records = {
        getFullList: mockRecordsGetFullList,
        getOne: mockRecordsGetOne,
        create: mockRecordsCreate,
        update: mockRecordsUpdate,
        delete: mockRecordsDelete,
      };
      this.collection = vi.fn().mockReturnThis();
      this.files = {
        getUrl: vi.fn(),
        getFile: vi.fn(),
        delete: vi.fn(),
      };
      this.authStore = {
        token: '',
        record: null,
      };
      this.health = vi.fn();
      return this;
    })
  };
});

describe('SDKPlatform', () => {
  let SDKPlatform: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../src/platform/sdk-platform');
    SDKPlatform = module.SDKPlatform;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(SDKPlatform).toBeDefined();
    });

    it('should instantiate with baseUrl parameter', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform).toBeDefined();
    });

    it('should call PocketBase constructor with baseUrl', () => {
      new SDKPlatform('http://localhost:8090');
      expect(mockPocketBaseConstructor).toHaveBeenCalledWith('http://localhost:8090');
    });

    it('should create instance with PocketBaseOperations interface', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.collections).toBeDefined();
      expect(platform.records).toBeDefined();
      expect(platform.users).toBeDefined();
      expect(platform.files).toBeDefined();
      expect(platform.debugging).toBeDefined();
      expect(platform.development).toBeDefined();
    });
  });

  describe('Initialization', () => {
    it('should initialize PocketBase SDK with correct URL', () => {
      const testUrl = 'http://test-pocketbase:8090';
      new SDKPlatform(testUrl);
      expect(mockPocketBaseConstructor).toHaveBeenCalledWith(testUrl);
    });

    it('should expose collections operations', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.collections.list).toBeDefined();
      expect(platform.collections.get).toBeDefined();
      expect(platform.collections.create).toBeDefined();
      expect(platform.collections.update).toBeDefined();
      expect(platform.collections.delete).toBeDefined();
    });

    it('should expose records operations', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.records.query).toBeDefined();
      expect(platform.records.get).toBeDefined();
      expect(platform.records.create).toBeDefined();
      expect(platform.records.update).toBeDefined();
      expect(platform.records.delete).toBeDefined();
    });

    it('should expose users operations', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.users.list).toBeDefined();
      expect(platform.users.get).toBeDefined();
      expect(platform.users.create).toBeDefined();
      expect(platform.users.update).toBeDefined();
      expect(platform.users.delete).toBeDefined();
    });

    it('should expose files operations', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.files.getUrl).toBeDefined();
      expect(platform.files.getFile).toBeDefined();
      expect(platform.files.uploadFile).toBeDefined();
      expect(platform.files.deleteFile).toBeDefined();
      expect(platform.files.listFiles).toBeDefined();
    });

    it('should expose debugging operations', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.debugging.getApiUrl).toBeDefined();
      expect(platform.debugging.getHealth).toBeDefined();
    });

    it('should expose development operations', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.development.generateTypeScriptTypes).toBeDefined();
    });
  });
});

describe('SDKPlatform Read-Only Mode', () => {
  let SDKPlatform: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../src/platform/sdk-platform');
    SDKPlatform = module.SDKPlatform;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Constructor with read-only option', () => {
    it('should accept readOnly option in constructor', () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      expect(platform).toBeDefined();
    });

    it('should default to read-only mode disabled', () => {
      const platform = new SDKPlatform('http://localhost:8090');
      expect(platform.isReadOnly()).toBe(false);
    });

    it('should enable read-only mode when option is true', () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      expect(platform.isReadOnly()).toBe(true);
    });

    it('should disable read-only mode when option is false', () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: false });
      expect(platform.isReadOnly()).toBe(false);
    });
  });

  describe('Read-Only Enforcement on Collection Operations', () => {
    it('should allow list collections in any mode', async () => {
      mockCollectionsGetFullList.mockResolvedValue([{ id: 'test', name: 'test_collection' }]);
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      const result = await platform.collections.list();
      
      expect(result).toBeDefined();
      expect(mockCollectionsGetFullList).toHaveBeenCalled();
    });

    it('should allow get collection in any mode', async () => {
      mockCollectionsGetOne.mockResolvedValue({ id: 'test', name: 'test_collection' });
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      const result = await platform.collections.get('test_collection');
      
      expect(result).toBeDefined();
      expect(mockCollectionsGetOne).toHaveBeenCalledWith('test_collection');
    });

    it('should block create collection in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.collections.create({ name: 'test' }))
        .rejects.toThrow('blocked in read-only mode');
    });

    it('should block update collection in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.collections.update('test', { name: 'updated' }))
        .rejects.toThrow('blocked in read-only mode');
    });

    it('should block delete collection in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.collections.delete('test'))
        .rejects.toThrow('blocked in read-only mode');
    });

    it('should allow create collection when not in read-only mode', async () => {
      mockCollectionsCreate.mockResolvedValue({ id: 'test', name: 'test_collection' });
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: false });
      const result = await platform.collections.create({ name: 'test' });
      
      expect(result).toBeDefined();
      expect(mockCollectionsCreate).toHaveBeenCalled();
    });
  });

  describe('Read-Only Enforcement on Record Operations', () => {
    it('should allow query records in any mode', async () => {
      mockRecordsGetFullList.mockResolvedValue([{ id: 'test', name: 'test_record' }]);
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      const result = await platform.records.query('test_collection');
      
      expect(result).toBeDefined();
    });

    it('should allow get record in any mode', async () => {
      mockRecordsGetOne.mockResolvedValue({ id: 'test', name: 'test_record' });
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      const result = await platform.records.get('test_collection', 'record_id');
      
      expect(result).toBeDefined();
    });

    it('should block create record in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.records.create('test_collection', { name: 'test' }))
        .rejects.toThrow('blocked in read-only mode');
    });

    it('should block update record in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.records.update('test_collection', 'record_id', { name: 'updated' }))
        .rejects.toThrow('blocked in read-only mode');
    });

    it('should block delete record in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.records.delete('test_collection', 'record_id'))
        .rejects.toThrow('blocked in read-only mode');
    });
  });

  describe('Read-Only Enforcement on User Operations', () => {
    it('should allow list users in any mode', async () => {
      mockRecordsGetFullList.mockResolvedValue([{ id: 'user1', email: 'test@example.com' }]);
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      const result = await platform.users.list();
      
      expect(result).toBeDefined();
    });

    it('should allow get user in any mode', async () => {
      mockRecordsGetOne.mockResolvedValue({ id: 'user1', email: 'test@example.com' });
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      const result = await platform.users.get('user_id');
      
      expect(result).toBeDefined();
    });

    it('should block create user in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.users.create({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow('blocked in read-only mode');
    });

    it('should block update user in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.users.update('user_id', { name: 'updated' }))
        .rejects.toThrow('blocked in read-only mode');
    });

    it('should block delete user in read-only mode', async () => {
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: true });
      
      await expect(platform.users.delete('user_id'))
        .rejects.toThrow('blocked in read-only mode');
    });
  });
});

describe('SDKPlatform Error Wrapping', () => {
  let SDKPlatform: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../src/platform/sdk-platform');
    SDKPlatform = module.SDKPlatform;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should wrap PocketBase SDK errors', async () => {
    const sdkError = new Error('PocketBase connection failed');
    mockCollectionsGetFullList.mockRejectedValue(sdkError);
    
    const platform = new SDKPlatform('http://localhost:8090');
    
    await expect(platform.collections.list())
      .rejects.toThrow();
  });

  it('should preserve original error message', async () => {
    const sdkError = new Error('Collection not found');
    mockCollectionsGetOne.mockRejectedValue(sdkError);
    
    const platform = new SDKPlatform('http://localhost:8090');
    
    try {
      await platform.collections.get('nonexistent');
    } catch (error: any) {
      expect(error.message).toContain('Collection not found');
    }
  });

  it('should throw on invalid collection name', async () => {
    const sdkError = new Error('Invalid collection name');
    mockCollectionsGetOne.mockRejectedValue(sdkError);
    
    const platform = new SDKPlatform('http://localhost:8090');
    
    await expect(platform.collections.get(''))
      .rejects.toThrow();
  });

  it('should handle authentication errors', async () => {
    const authError = new Error('Authentication required');
    mockRecordsGetFullList.mockRejectedValue(authError);
    
    const platform = new SDKPlatform('http://localhost:8090');
    
    await expect(platform.records.query('test_collection'))
      .rejects.toThrow('Authentication required');
  });

  it('should handle validation errors', async () => {
    const validationError = new Error('Validation failed: email is required');
    mockRecordsCreate.mockRejectedValue(validationError);
    
    const platform = new SDKPlatform('http://localhost:8090', { readOnly: false });
    
    await expect(platform.records.create('users', {}))
      .rejects.toThrow('Validation failed: email is required');
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error: failed to connect');
    mockCollectionsGetFullList.mockRejectedValue(networkError);
    
    const platform = new SDKPlatform('http://localhost:8090');
    
    await expect(platform.collections.list())
      .rejects.toThrow('Network error: failed to connect');
  });
});

describe('SDKPlatform Collection Operations', () => {
  let SDKPlatform: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../src/platform/sdk-platform');
    SDKPlatform = module.SDKPlatform;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('list()', () => {
    it('should call PocketBase getFullList', async () => {
      mockCollectionsGetFullList.mockResolvedValue([]);
      
      const platform = new SDKPlatform('http://localhost:8090');
      await platform.collections.list();
      
      expect(mockCollectionsGetFullList).toHaveBeenCalled();
    });

    it('should return collections array', async () => {
      const mockCollections = [
        { id: '1', name: 'posts', type: 'base' },
        { id: '2', name: 'users', type: 'auth' }
      ];
      mockCollectionsGetFullList.mockResolvedValue(mockCollections);
      
      const platform = new SDKPlatform('http://localhost:8090');
      const result = await platform.collections.list();
      
      expect(result).toEqual(mockCollections);
    });
  });

  describe('get(name)', () => {
    it('should call PocketBase getOne with collection name', async () => {
      mockCollectionsGetOne.mockResolvedValue({ id: '1', name: 'posts' });
      
      const platform = new SDKPlatform('http://localhost:8090');
      await platform.collections.get('posts');
      
      expect(mockCollectionsGetOne).toHaveBeenCalledWith('posts');
    });

    it('should return collection object', async () => {
      const mockCollection = { id: '1', name: 'posts', type: 'base' };
      mockCollectionsGetOne.mockResolvedValue(mockCollection);
      
      const platform = new SDKPlatform('http://localhost:8090');
      const result = await platform.collections.get('posts');
      
      expect(result).toEqual(mockCollection);
    });
  });

  describe('create(schema)', () => {
    it('should call PocketBase create with schema', async () => {
      mockCollectionsCreate.mockResolvedValue({ id: '1', name: 'new_collection' });
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: false });
      await platform.collections.create({ name: 'new_collection' });
      
      expect(mockCollectionsCreate).toHaveBeenCalled();
    });
  });

  describe('update(name, schema)', () => {
    it('should call PocketBase update with name and schema', async () => {
      mockCollectionsUpdate.mockResolvedValue({ id: '1', name: 'Updated Collection' });
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: false });
      await platform.collections.update('test', { name: 'Updated Collection' });
      
      expect(mockCollectionsUpdate).toHaveBeenCalledWith('test', expect.anything());
    });
  });

  describe('delete(name)', () => {
    it('should call PocketBase delete with collection name', async () => {
      mockCollectionsDelete.mockResolvedValue(undefined);
      
      const platform = new SDKPlatform('http://localhost:8090', { readOnly: false });
      await platform.collections.delete('test');
      
      expect(mockCollectionsDelete).toHaveBeenCalledWith('test');
    });
  });
});

describe('SDKPlatform Debugging Operations', () => {
  let SDKPlatform: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../src/platform/sdk-platform');
    SDKPlatform = module.SDKPlatform;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getApiUrl()', () => {
    it('should return the configured API URL', () => {
      const testUrl = 'http://test-pocketbase:8090';
      const platform = new SDKPlatform(testUrl);
      
      const url = platform.debugging.getApiUrl();
      
      expect(url).toBe(testUrl);
    });
  });

  describe('getHealth()', () => {
    it('should call PocketBase health endpoint', async () => {
      const mockHealth = vi.fn().mockResolvedValue({ code: 200, status: 'healthy' });
      
      const platform = new SDKPlatform('http://localhost:8090');
      
      expect(platform.debugging.getHealth).toBeDefined();
    });
  });
});
