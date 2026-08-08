import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlSecurityCredentialRepository } from "../repositories/SqlSecurityCredentialRepository";
import { SetSecurityCredentialUseCase } from "../../../../core/src/application/use-cases/SetSecurityCredentialUseCase";
import { VerifyPasswordUseCase } from "../../../../core/src/application/use-cases/VerifyPasswordUseCase";
import { ResetPasswordWithSecurityAnswerUseCase } from "../../../../core/src/application/use-cases/ResetPasswordWithSecurityAnswerUseCase";
import { IncorrectPasswordError } from "../../../../core/src/application/use-cases/SecurityErrors";

function buildMigratedConnection(): NodeSqliteTestConnection {
  const connection = new NodeSqliteTestConnection();
  const runner = new MigrationRunner(connection, join(__dirname, "..", "migrations"));
  runner.run();
  return connection;
}

test("no security credential exists on a fresh database", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlSecurityCredentialRepository(connection);
  assert.equal(repository.get(), undefined);

  const verifyResult = new VerifyPasswordUseCase(repository).execute({ password: "x" });
  assert.equal(verifyResult.isPasswordSet, false);
  assert.equal(verifyResult.isValid, true);
});

test("setting a security credential persists across repository reads", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlSecurityCredentialRepository(connection);

  new SetSecurityCredentialUseCase(repository).execute({
    newPassword: "admin-password",
    securityQuestion: "نام اولین باشگاه؟",
    securityAnswer: "آرتور",
  });

  const stored = repository.get();
  assert.equal(stored?.isPasswordSet, true);
  assert.equal(stored?.securityQuestion, "نام اولین باشگاه؟");
  assert.notEqual(stored?.passwordHash, "admin-password");

  const verifyResult = new VerifyPasswordUseCase(repository).execute({
    password: "admin-password",
  });
  assert.equal(verifyResult.isValid, true);
});

test("updating the credential twice requires the correct current password each time", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlSecurityCredentialRepository(connection);
  const useCase = new SetSecurityCredentialUseCase(repository);

  useCase.execute({
    newPassword: "first-password",
    securityQuestion: "سوال؟",
    securityAnswer: "جواب",
  });

  assert.throws(
    () =>
      useCase.execute({
        currentPassword: "not-the-password",
        newPassword: "second-password",
        securityQuestion: "سوال؟",
        securityAnswer: "جواب",
      }),
    IncorrectPasswordError
  );

  useCase.execute({
    currentPassword: "first-password",
    newPassword: "second-password",
    securityQuestion: "سوال؟",
    securityAnswer: "جواب",
  });

  const verifyResult = new VerifyPasswordUseCase(repository).execute({
    password: "second-password",
  });
  assert.equal(verifyResult.isValid, true);
});

test("password can be recovered through the security question after the database is reloaded", () => {
  const connection = buildMigratedConnection();
  const firstRepository = new SqlSecurityCredentialRepository(connection);

  new SetSecurityCredentialUseCase(firstRepository).execute({
    newPassword: "forgotten-password",
    securityQuestion: "رنگ مورد علاقه؟",
    securityAnswer: "برنزی",
  });

  const secondRepository = new SqlSecurityCredentialRepository(connection);
  new ResetPasswordWithSecurityAnswerUseCase(secondRepository).execute({
    securityAnswer: "برنزی",
    newPassword: "recovered-password",
  });

  const verifyResult = new VerifyPasswordUseCase(secondRepository).execute({
    password: "recovered-password",
  });
  assert.equal(verifyResult.isValid, true);
});
