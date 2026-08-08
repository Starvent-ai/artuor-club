import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";

export class MigrationRunner {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly migrationsDirectory: string
  ) {}

  run(): void {
    const files = readdirSync(this.migrationsDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(this.migrationsDirectory, file), "utf-8");
      const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);

      for (const statement of statements) {
        this.connection.execute(statement);
      }
    }
  }
}
