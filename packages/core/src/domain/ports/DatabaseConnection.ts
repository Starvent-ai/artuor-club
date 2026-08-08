export interface DatabaseConnection {
  execute(sql: string, params?: unknown[]): void;
  queryOne<T>(sql: string, params?: unknown[]): T | undefined;
  queryAll<T>(sql: string, params?: unknown[]): T[];
  runInTransaction<T>(work: () => T): T;
}
