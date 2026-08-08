import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  SecurityCredentialRecord,
  SecurityCredentialRepository,
} from "../../../domain/ports/SecurityCredentialRepository";
import { SetSecurityCredentialUseCase } from "../SetSecurityCredentialUseCase";
import { VerifyPasswordUseCase } from "../VerifyPasswordUseCase";
import { ResetPasswordWithSecurityAnswerUseCase } from "../ResetPasswordWithSecurityAnswerUseCase";
import { GetSecurityStatusUseCase } from "../GetSecurityStatusUseCase";
import {
  IncorrectPasswordError,
  IncorrectSecurityAnswerError,
  SecurityNotConfiguredError,
} from "../SecurityErrors";

class InMemorySecurityCredentialRepository implements SecurityCredentialRepository {
  private record: SecurityCredentialRecord | undefined;

  get(): SecurityCredentialRecord | undefined {
    return this.record;
  }

  save(record: SecurityCredentialRecord): void {
    this.record = record;
  }
}

test("sets a password and security question for the first time without needing a current password", () => {
  const repository = new InMemorySecurityCredentialRepository();
  const useCase = new SetSecurityCredentialUseCase(repository);

  useCase.execute({
    newPassword: "first-password",
    securityQuestion: "نام حیوان خانگی شما؟",
    securityAnswer: "میو",
  });

  const status = new GetSecurityStatusUseCase(repository).execute();
  assert.equal(status.isPasswordSet, true);
  assert.equal(status.securityQuestion, "نام حیوان خانگی شما؟");
});

test("rejects updating the password without the correct current password", () => {
  const repository = new InMemorySecurityCredentialRepository();
  const useCase = new SetSecurityCredentialUseCase(repository);

  useCase.execute({
    newPassword: "first-password",
    securityQuestion: "سوال؟",
    securityAnswer: "جواب",
  });

  assert.throws(
    () =>
      useCase.execute({
        currentPassword: "wrong-current-password",
        newPassword: "second-password",
        securityQuestion: "سوال؟",
        securityAnswer: "جواب",
      }),
    IncorrectPasswordError
  );
});

test("allows updating the password with the correct current password", () => {
  const repository = new InMemorySecurityCredentialRepository();
  const useCase = new SetSecurityCredentialUseCase(repository);

  useCase.execute({
    newPassword: "first-password",
    securityQuestion: "سوال؟",
    securityAnswer: "جواب",
  });

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

test("verify password reports no password required when never configured", () => {
  const repository = new InMemorySecurityCredentialRepository();
  const result = new VerifyPasswordUseCase(repository).execute({ password: "anything" });
  assert.equal(result.isPasswordSet, false);
  assert.equal(result.isValid, true);
});

test("resets the password when the security answer matches, case and spacing insensitive", () => {
  const repository = new InMemorySecurityCredentialRepository();
  new SetSecurityCredentialUseCase(repository).execute({
    newPassword: "old-password",
    securityQuestion: "شهر محل تولد؟",
    securityAnswer: "Shiraz",
  });

  new ResetPasswordWithSecurityAnswerUseCase(repository).execute({
    securityAnswer: "  shiraz  ",
    newPassword: "brand-new-password",
  });

  const result = new VerifyPasswordUseCase(repository).execute({
    password: "brand-new-password",
  });
  assert.equal(result.isValid, true);
});

test("rejects password reset when the security answer is incorrect", () => {
  const repository = new InMemorySecurityCredentialRepository();
  new SetSecurityCredentialUseCase(repository).execute({
    newPassword: "old-password",
    securityQuestion: "شهر محل تولد؟",
    securityAnswer: "شیراز",
  });

  assert.throws(
    () =>
      new ResetPasswordWithSecurityAnswerUseCase(repository).execute({
        securityAnswer: "تهران",
        newPassword: "brand-new-password",
      }),
    IncorrectSecurityAnswerError
  );
});

test("rejects password reset when security has never been configured", () => {
  const repository = new InMemorySecurityCredentialRepository();
  assert.throws(
    () =>
      new ResetPasswordWithSecurityAnswerUseCase(repository).execute({
        securityAnswer: "anything",
        newPassword: "brand-new-password",
      }),
    SecurityNotConfiguredError
  );
});
