import type { SecurityCredentialRepository } from "../../domain/ports/SecurityCredentialRepository";
import { PasswordHasher } from "../../domain/services/PasswordHasher";

export interface VerifyPasswordInput {
  password: string;
}

export interface VerifyPasswordResult {
  isPasswordSet: boolean;
  isValid: boolean;
}

export class VerifyPasswordUseCase {
  constructor(
    private readonly securityCredentialRepository: SecurityCredentialRepository,
    private readonly passwordHasher: PasswordHasher = new PasswordHasher()
  ) {}

  execute(input: VerifyPasswordInput): VerifyPasswordResult {
    const existing = this.securityCredentialRepository.get();

    if (!existing?.isPasswordSet || !existing.passwordHash) {
      return { isPasswordSet: false, isValid: true };
    }

    return {
      isPasswordSet: true,
      isValid: this.passwordHasher.verify(input.password, existing.passwordHash),
    };
  }
}
