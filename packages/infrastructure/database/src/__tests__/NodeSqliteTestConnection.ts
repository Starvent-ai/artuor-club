import { DatabaseSync } from "node:sqlite";
import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";

export class NodeSqliteTestConnection implements DatabaseConnection {
  private readonly db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(":memory:");
    this.db.exec("PRAGMA foreign_keys = ON");
  }

  execute(sql: string, params: unknown[] = []): void {
    this.db.prepare(sql).run(...(params as never[]));
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...(params as never[])) as T | undefined;
  }

  queryAll<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...(params as never[])) as T[];
  }

  runInTransaction<T>(work: () => T): T {
    this.db.exec("BEGIN");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
