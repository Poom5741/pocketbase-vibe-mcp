export class ReadOnlyError extends Error {
  constructor(operation: string) {
    super(`Operation '${operation}' is blocked in read-only mode. Use the PocketBase dashboard to make schema changes.`);
    this.name = 'Error';
  }
}

export const WRITE_OPERATIONS = Object.freeze([
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
  'delete_file',
] as const);

export const READ_OPERATIONS = Object.freeze([
  'list_collections',
  'get_collection',
  'query_collection',
  'get_record',
  'list_users',
  'get_user',
  'list_files',
  'generate_typescript_types',
  'get_api_url',
  'get_health_status',
] as const);

export function isReadOnlyOperation(operation: string): boolean {
  return READ_OPERATIONS.includes(operation as any);
}

export function isWriteOperation(operation: string): boolean {
  return WRITE_OPERATIONS.includes(operation as any);
}
