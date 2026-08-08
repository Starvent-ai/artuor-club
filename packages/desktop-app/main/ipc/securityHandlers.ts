import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlSecurityCredentialRepository } from "../../../infrastructure/database/src/repositories/SqlSecurityCredentialRepository";
import { GetSecurityStatusUseCase } from "../../../core/src/application/use-cases/GetSecurityStatusUseCase";
import { SetSecurityCredentialUseCase } from "../../../core/src/application/use-cases/SetSecurityCredentialUseCase";
import { VerifyPasswordUseCase } from "../../../core/src/application/use-cases/VerifyPasswordUseCase";
import { ResetPasswordWithSecurityAnswerUseCase } from "../../../core/src/application/use-cases/ResetPasswordWithSecurityAnswerUseCase";

export function registerSecurityHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const securityCredentialRepository = new SqlSecurityCredentialRepository(connection);

  const getSecurityStatusUseCase = new GetSecurityStatusUseCase(securityCredentialRepository);
  const setSecurityCredentialUseCase = new SetSecurityCredentialUseCase(
    securityCredentialRepository
  );
  const verifyPasswordUseCase = new VerifyPasswordUseCase(securityCredentialRepository);
  const resetPasswordUseCase = new ResetPasswordWithSecurityAnswerUseCase(
    securityCredentialRepository
  );

  ipcMain.handle("security:getStatus", () => {
    return getSecurityStatusUseCase.execute();
  });

  ipcMain.handle(
    "security:setCredential",
    (
      _event,
      input: {
        currentPassword?: string;
        newPassword: string;
        securityQuestion: string;
        securityAnswer: string;
      }
    ) => {
      setSecurityCredentialUseCase.execute(input);
    }
  );

  ipcMain.handle("security:verifyPassword", (_event, password: string) => {
    return verifyPasswordUseCase.execute({ password });
  });

  ipcMain.handle(
    "security:resetPasswordWithAnswer",
    (_event, input: { securityAnswer: string; newPassword: string }) => {
      resetPasswordUseCase.execute(input);
    }
  );
}
