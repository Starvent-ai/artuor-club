import { useEffect, useState } from "react";
import "./create-open-tab-dialog.css";

interface ForgotPasswordDialogProps {
  onRecovered: () => void;
  onCancel: () => void;
}

export function ForgotPasswordDialog({ onRecovered, onCancel }: ForgotPasswordDialogProps) {
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.arthurClub.getSecurityStatus().then((status) => {
      setSecurityQuestion(status.securityQuestion);
    });
  }, []);

  async function submit() {
    if (newPassword !== confirmPassword) {
      setErrorMessage("رمز جدید و تکرار آن یکسان نیستند");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await window.arthurClub.resetPasswordWithSecurityAnswer({
        securityAnswer,
        newPassword,
      });
      onRecovered();
    } catch {
      setErrorMessage("پاسخ سؤال امنیتی نادرست است");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    securityAnswer.trim().length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <h2 className="create-open-tab-dialog__title">بازیابی رمز عبور</h2>

        {securityQuestion && <p className="create-open-tab-dialog__warning">{securityQuestion}</p>}

        <input
          className="create-open-tab-dialog__input"
          placeholder="پاسخ سؤال امنیتی"
          value={securityAnswer}
          onChange={(event) => setSecurityAnswer(event.target.value)}
          autoFocus
        />
        <input
          type="password"
          className="create-open-tab-dialog__input"
          placeholder="رمز عبور جدید"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <input
          type="password"
          className="create-open-tab-dialog__input"
          placeholder="تکرار رمز عبور جدید"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {errorMessage && <p className="create-open-tab-dialog__warning">{errorMessage}</p>}

        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            انصراف
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={submit}
            disabled={isSubmitting || !canSubmit}
          >
            بازیابی رمز
          </button>
        </div>
      </div>
    </div>
  );
}
