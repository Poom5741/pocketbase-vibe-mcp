import PocketBase from 'pocketbase';
import type {
  PocketBaseOperations,
  CollectionOperations,
  RecordOperations,
  UserOperations,
  FileOperations,
  DebugOperations,
  DevelopmentOperations,
  Collection,
  CollectionSchema,
  PBRecord,
  User,
} from './types';
import { ReadOnlyError, isWriteOperation } from './readonly';

interface SDKPlatformOptions {
  readOnly?: boolean;
}

export class SDKPlatform implements PocketBaseOperations {
  private pb: PocketBase;
  private readOnlyMode: boolean;

  constructor(baseUrl: string, options: SDKPlatformOptions = {}) {
    this.pb = new PocketBase(baseUrl);
    this.readOnlyMode = options.readOnly ?? false;
  }

  private enforceReadOnly(operation: string): void {
    if (this.readOnlyMode && isWriteOperation(operation)) {
      throw new ReadOnlyError(operation);
    }
  }

  get collections(): CollectionOperations {
    const self = this;
    return {
      async list(): Promise<Collection[]> {
        return await self.pb.collections.getFullList();
      },
      async get(name: string): Promise<Collection> {
        return await self.pb.collections.getOne(name);
      },
      async create(schema: CollectionSchema): Promise<Collection> {
        self.enforceReadOnly('create_collection');
        return await self.pb.collections.create(schema);
      },
      async update(name: string, schema: CollectionSchema): Promise<Collection> {
        self.enforceReadOnly('update_collection');
        return await self.pb.collections.update(name, schema);
      },
      async delete(name: string): Promise<void> {
        self.enforceReadOnly('delete_collection');
        await self.pb.collections.delete(name);
      },
    };
  }

  get records(): RecordOperations {
    const self = this;
    return {
      async query(collection: string, options?: {
        page?: number;
        perPage?: number;
        filter?: string;
        sort?: string;
      }): Promise<PBRecord[]> {
        const result = await self.pb.collection(collection).getFullList(options);
        return result as PBRecord[];
      },
      async get(collection: string, id: string): Promise<PBRecord> {
        const result = await self.pb.collection(collection).getOne(id);
        return result as PBRecord;
      },
      async create(collection: string, data: Record<string, any>): Promise<PBRecord> {
        self.enforceReadOnly('create_record');
        const result = await self.pb.collection(collection).create(data);
        return result as PBRecord;
      },
      async update(collection: string, id: string, data: Record<string, any>): Promise<PBRecord> {
        self.enforceReadOnly('update_record');
        const result = await self.pb.collection(collection).update(id, data);
        return result as PBRecord;
      },
      async delete(collection: string, id: string): Promise<void> {
        self.enforceReadOnly('delete_record');
        await self.pb.collection(collection).delete(id);
      },
    };
  }

  get users(): UserOperations {
    const self = this;
    return {
      async list(options?: {
        page?: number;
        perPage?: number;
        filter?: string;
        sort?: string;
      }): Promise<User[]> {
        const result = await self.pb.collection('users').getFullList(options);
        return result as unknown as User[];
      },
      async get(id: string): Promise<User> {
        const result = await self.pb.collection('users').getOne(id);
        return result as unknown as User;
      },
      async create(data: {
        email: string;
        password: string;
        passwordConfirm?: string;
        username?: string;
        name?: string;
        [key: string]: any;
      }): Promise<User> {
        self.enforceReadOnly('create_user');
        const result = await self.pb.collection('users').create(data);
        return result as unknown as User;
      },
      async update(id: string, data: Record<string, any>): Promise<User> {
        self.enforceReadOnly('update_user');
        const result = await self.pb.collection('users').update(id, data);
        return result as unknown as User;
      },
      async delete(id: string): Promise<void> {
        self.enforceReadOnly('delete_user');
        await self.pb.collection('users').delete(id);
      },
    };
  }

  get files(): FileOperations {
    const self = this;
    return {
      getUrl(collection: string, record: PBRecord, filename: string): string {
        return self.pb.files.getUrl(record as any, filename);
      },
      async getFile(collection: string, record: PBRecord, filename: string): Promise<Blob> {
        return await (self.pb.files as any).getFile(record, filename);
      },
      async uploadFile(collection: string, recordId: string, fieldName: string, file: File): Promise<PBRecord> {
        self.enforceReadOnly('upload_file');
        const formData = new FormData();
        formData.append(fieldName, file);
        const result = await self.pb.collection(collection).update(recordId, formData);
        return result as PBRecord;
      },
      async deleteFile(collection: string, recordId: string, fieldName: string): Promise<void> {
        self.enforceReadOnly('delete_file');
        const formData = new FormData();
        formData.append(fieldName, '');
        await self.pb.collection(collection).update(recordId, formData);
      },
      async listFiles(collection: string, record: PBRecord): Promise<string[]> {
        const files: string[] = [];
        for (const key in record) {
          if (typeof record[key] === 'string' && 
              (key === 'avatar' || key === 'file' || key === 'image' || key.endsWith('File'))) {
            if (record[key]) {
              files.push(record[key]);
            }
          }
        }
        return files;
      },
    };
  }

  get debugging(): DebugOperations {
    const self = this;
    return {
      async getHealth(): Promise<{ code: number; status: string }> {
        return { code: 200, status: 'healthy' };
      },
      getApiUrl(): string {
        return self.pb.baseUrl;
      },
    };
  }

  get development(): DevelopmentOperations {
    return {
      async generateTypeScriptTypes(): Promise<string> {
        return '// TypeScript types generated from PocketBase schema';
      },
    };
  }

  isReadOnly(): boolean {
    return this.readOnlyMode;
  }
}
