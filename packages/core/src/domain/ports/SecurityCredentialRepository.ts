export const SECURITY_CREDENTIAL_ID = "default";

export interface SecurityCredentialRecord {
  id: string;
  isPasswordSet: boolean;
  passwordHash: string | null;
  securityQuestion: string | null;
  securityAnswerHash: string | null;
  updatedAt: string;
}

export interface SecurityCredentialRepository {
  get(): SecurityCredentialRecord | undefined;
  save(record: SecurityCredentialRecord): void;
}
