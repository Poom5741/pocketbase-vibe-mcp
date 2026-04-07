export interface TypeSchemaField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  options?: Record<string, any>;
}

export interface CollectionSchema {
  name: string;
  type: 'base' | 'auth' | 'view';
  schema?: TypeSchemaField[];
  listRule?: string;
  viewRule?: string;
  createRule?: string;
  updateRule?: string;
  deleteRule?: string;
}

export interface Collection {
  id: string;
  name: string;
  type: 'base' | 'auth' | 'view';
  schema: TypeSchemaField[];
  listRule?: string;
  viewRule?: string;
  createRule?: string;
  updateRule?: string;
  deleteRule?: string;
  system?: boolean;
}

export interface PBRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatar?: string;
  emailVisibility?: boolean;
  verified?: boolean;
  created?: string;
  updated?: string;
  [key: string]: any;
}

export interface CollectionOperations {
  list(): Promise<Collection[]>;
  get(name: string): Promise<Collection>;
  create(schema: CollectionSchema): Promise<Collection>;
  update(name: string, schema: CollectionSchema): Promise<Collection>;
  delete(name: string): Promise<void>;
}

export interface RecordOperations {
  query(collection: string, options?: {
    page?: number;
    perPage?: number;
    filter?: string;
    sort?: string;
  }): Promise<PBRecord[]>;
  get(collection: string, id: string): Promise<PBRecord>;
  create(collection: string, data: Record<string, any>): Promise<PBRecord>;
  update(collection: string, id: string, data: Record<string, any>): Promise<PBRecord>;
  delete(collection: string, id: string): Promise<void>;
}

export interface UserOperations {
  list(options?: {
    page?: number;
    perPage?: number;
    filter?: string;
    sort?: string;
  }): Promise<User[]>;
  get(id: string): Promise<User>;
  create(data: {
    email: string;
    password: string;
    passwordConfirm?: string;
    username?: string;
    name?: string;
    [key: string]: any;
  }): Promise<User>;
  update(id: string, data: Record<string, any>): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface FileOperations {
  getUrl(collection: string, record: PBRecord, filename: string): string;
  getFile(collection: string, record: PBRecord, filename: string): Promise<Blob>;
  uploadFile(collection: string, recordId: string, fieldName: string, file: File): Promise<PBRecord>;
  deleteFile(collection: string, recordId: string, fieldName: string): Promise<void>;
  listFiles(collection: string, record: PBRecord): Promise<string[]>;
}

export interface DebugOperations {
  getHealth(): Promise<{ code: number; status: string }>;
  getApiUrl(): string;
}

export interface DevelopmentOperations {
  generateTypeScriptTypes(): Promise<string>;
}

export interface PocketBaseOperations {
  collections: CollectionOperations;
  records: RecordOperations;
  users: UserOperations;
  files: FileOperations;
  debugging: DebugOperations;
  development: DevelopmentOperations;
}

export { PocketBaseOperations as default };

export const PocketBaseOperations = {} as any;
export const CollectionOperations = {} as any;
export const RecordOperations = {} as any;
export const UserOperations = {} as any;
export const FileOperations = {} as any;
export const DebugOperations = {} as any;
export const DevelopmentOperations = {} as any;
export const Collection = {} as any;
export const CollectionSchema = {} as any;
export const PBRecord = {} as any;
export const Record = PBRecord;
export const User = {} as any;
export const TypeSchemaField = {} as any;
