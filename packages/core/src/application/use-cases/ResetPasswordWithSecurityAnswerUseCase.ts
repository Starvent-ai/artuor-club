import type { SecurityCredentialRepository } from "../../domain/ports/SecurityCredentialRepository";
import { PasswordHasher } from "../../domain/services/PasswordHasher";
import { IncorrectSecurityAnswerError, SecurityNotConfiguredError } from "./SecurityErrors";

export interface ResetPasswordWithSecurityAnswerInput {
  securityAnswer: string;
  newPassword: string;
  now?: Date;
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export class ResetPasswordWithSecurityAnswerUseCase {
  constructor(
    private readonly securityCredentialRepository: SecurityCredentialRepository,
    private readonly passwordHasher: PasswordHasher = new PasswordHasher()
  ) {}

  execute(input: ResetPasswordWithSecurityAnswerInput): void {
    const existing = this.securityCredentialRepository.get();

    if (!existing?.isPasswordSet || !existing.securityAnswerHash) {
      throw new SecurityNotConfiguredError();
    }

    const isAnswerCorrect = this.passwordHasher.verify(
      normalizeAnswer(input.securityAnswer),
      existing.securityAnswerHash
    );

    if (!isAnswerCorrect) {
      throw new IncorrectSecurityAnswerError();
    }

    this.securityCredentialRepository.save({
      ...existing,
      passwordHash: this.passwordHasher.hash(input.newPassword),
      updatedAt: (input.now ?? new Date()).toISOString(),
    });
  }
}
