import type { SecurityCredentialRepository } from "../../domain/ports/SecurityCredentialRepository";

export interface SecurityStatus {
  isPasswordSet: boolean;
  securityQuestion: string | null;
}

export class GetSecurityStatusUseCase {
  constructor(private readonly securityCredentialRepository: SecurityCredentialRepository) {}

  execute(): SecurityStatus {
    const existing = this.securityCredentialRepository.get();

    if (!existing?.isPasswordSet) {
      return { isPasswordSet: false, securityQuestion: null };
    }

    return { isPasswordSet: true, securityQuestion: existing.securityQuestion };
  }
}
