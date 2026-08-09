import { useEffect, useState } from "react";
import "./settings-screen.css";
import type { BackupHistoryEntryDto } from "../../preload/index";
import { formatJalaliDateTimeLabel } from "../utils/formatJalaliDateTime";

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [isPasswordSet, setIsPasswordSet] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntryDto[]>([]);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [isBackupBusy, setIsBackupBusy] = useState(false);

  function refreshBackupHistory() {
    window.arthurClub.listBackupHistory().then(setBackupHistory);
  }

  useEffect(() => {
    refreshBackupHistory();
  }, []);

  async function createBackup() {
    setIsBackupBusy(true);
    setBackupMessage(null);
    const result = await window.arthurClub.createManualBackup();
    setIsBackupBusy(false);

    if (result.status === "success") {
      setBackupMessage("بکاپ با موفقیت ذخیره شد");
      refreshBackupHistory();
    } else if (result.status === "failed") {
      setBackupMessage("تهیهٔ بکاپ با خطا مواجه شد");
      refreshBackupHistory();
    }
  }

  async function restoreBackup() {
    const confirmed = window.confirm(
      "بازیابی بکاپ، اطلاعات فعلی را جایگزین می‌کند و برنامه مجدداً راه‌اندازی می‌شود. ادامه می‌دهید؟"
    );
    if (!confirmed) {
      return;
    }
    setIsBackupBusy(true);
    await window.arthurClub.restoreBackup();
  }

  useEffect(() => {
    window.arthurClub.getSecurityStatus().then((status) => {
      setIsPasswordSet(status.isPasswordSet);
    });
  }, []);

  async function submit() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("رمز جدید و تکرار آن یکسان نیستند");
      return;
    }

    if (newPassword.length === 0 || securityQuestion.trim().length === 0 || securityAnswer.trim().length === 0) {
      setErrorMessage("همهٔ فیلدها باید تکمیل شوند");
      return;
    }

    setIsSubmitting(true);

    try {
      await window.arthurClub.setSecurityCredential({
        currentPassword: isPasswordSet ? currentPassword : undefined,
        newPassword,
        securityQuestion: securityQuestion.trim(),
        securityAnswer,
      });
      setIsPasswordSet(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityQuestion("");
      setSecurityAnswer("");
      setSuccessMessage("تغییرات با موفقیت ذخیره شد");
    } catch {
      setErrorMessage("رمز عبور فعلی نادرست است");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-screen__header">
        <button type="button" className="settings-screen__back-button" onClick={onClose}>
          بازگشت
        </button>
        <h1 className="settings-screen__title">تنظیمات</h1>
      </div>

      <div className="settings-screen__content">
        <section className="settings-screen__section">
          <h2 className="settings-screen__section-title">رمز عبور و سؤال امنیتی</h2>

          {isPasswordSet && (
            <input
              type="password"
              className="settings-screen__input"
              placeholder="رمز عبور فعلی"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          )}

          <input
            type="password"
            className="settings-screen__input"
            placeholder={isPasswordSet ? "رمز عبور جدید" : "رمز عبور"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <input
            type="password"
            className="settings-screen__input"
            placeholder="تکرار رمز عبور"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <input
            className="settings-screen__input"
            placeholder="سؤال امنیتی"
            value={securityQuestion}
            onChange={(event) => setSecurityQuestion(event.target.value)}
          />
          <input
            className="settings-screen__input"
            placeholder="پاسخ سؤال امنیتی"
            value={securityAnswer}
            onChange={(event) => setSecurityAnswer(event.target.value)}
          />

          {errorMessage && <p className="settings-screen__error">{errorMessage}</p>}
          {successMessage && <p className="settings-screen__success">{successMessage}</p>}

          <button
            type="button"
            className="settings-screen__save-button"
            onClick={submit}
            disabled={isSubmitting}
          >
            ذخیره تغییرات
          </button>
        </section>

        <section className="settings-screen__section">
          <h2 className="settings-screen__section-title">پشتیبان‌گیری</h2>

          <div className="settings-screen__backup-actions">
            <button
              type="button"
              className="settings-screen__save-button"
              onClick={createBackup}
              disabled={isBackupBusy}
            >
              تهیهٔ بکاپ دستی
            </button>
            <button
              type="button"
              className="settings-screen__restore-button"
              onClick={restoreBackup}
              disabled={isBackupBusy}
            >
              بازیابی از بکاپ
            </button>
          </div>

          {backupMessage && <p className="settings-screen__success">{backupMessage}</p>}

          <div className="settings-screen__backup-history">
            {backupHistory.length === 0 && (
              <p className="settings-screen__backup-empty">هنوز بکاپی ثبت نشده است</p>
            )}
            {backupHistory.map((entry) => (
              <div key={entry.id} className="settings-screen__backup-row">
                <span>{entry.type === "manual" ? "دستی" : "خودکار"}</span>
                <span>{entry.status === "success" ? "موفق" : "ناموفق"}</span>
                <span>{formatJalaliDateTimeLabel(entry.createdAt)}</span>
                <span>{entry.filePath}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
