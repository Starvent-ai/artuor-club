import type {
  SecurityCredentialRepository,
} from "../../domain/ports/SecurityCredentialRepository";
import { SECURITY_CREDENTIAL_ID } from "../../domain/ports/SecurityCredentialRepository";
import { PasswordHasher } from "../../domain/services/PasswordHasher";
import { IncorrectPasswordError } from "./SecurityErrors";

export interface SetSecurityCredentialInput {
  currentPassword?: string;
  newPassword: string;
  securityQuestion: string;
  securityAnswer: string;
  now?: Date;
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export class SetSecurityCredentialUseCase {
  constructor(
    private readonly securityCredentialRepository: SecurityCredentialRepository,
    private readonly passwordHasher: PasswordHasher = new PasswordHasher()
  ) {}

  execute(input: SetSecurityCredentialInput): void {
    const existing = this.securityCredentialRepository.get();

    if (existing?.isPasswordSet) {
      if (
        !input.currentPassword ||
        !this.passwordHasher.verify(input.currentPassword, existing.passwordHash ?? "")
      ) {
        throw new IncorrectPasswordError();
      }
    }

    const now = input.now ?? new Date();

    this.securityCredentialRepository.save({
      id: SECURITY_CREDENTIAL_ID,
      isPasswordSet: true,
      passwordHash: this.passwordHasher.hash(input.newPassword),
      securityQuestion: input.securityQuestion.trim(),
      securityAnswerHash: this.passwordHasher.hash(normalizeAnswer(input.securityAnswer)),
      updatedAt: now.toISOString(),
    });
  }
}
