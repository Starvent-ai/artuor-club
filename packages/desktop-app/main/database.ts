import { join } from "node:path";
import { BetterSqliteConnection } from "../../infrastructure/database/src/BetterSqliteConnection";
import { MigrationRunner } from "../../infrastructure/database/src/MigrationRunner";
import type { DatabaseConnection } from "../../core/src/domain/ports/DatabaseConnection";

export function createAppDatabaseConnection(databaseFilePath: string): DatabaseConnection {
  const connection = new BetterSqliteConnection(databaseFilePath);
  const migrationsPath = join(__dirname, "..", "..", "infrastructure", "database", "src", "migrations");
  new MigrationRunner(connection, migrationsPath).run();
  return connection;
}
