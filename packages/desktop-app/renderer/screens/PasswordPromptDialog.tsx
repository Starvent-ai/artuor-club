import { useState } from "react";
import "./create-open-tab-dialog.css";

interface PasswordPromptDialogProps {
  onUnlocked: () => void;
  onCancel: () => void;
  onForgotPassword: () => void;
}

export function PasswordPromptDialog({
  onUnlocked,
  onCancel,
  onForgotPassword,
}: PasswordPromptDialogProps) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await window.arthurClub.verifyPassword(password);
    setIsSubmitting(false);

    if (!result.isValid) {
      setErrorMessage("رمز عبور اشتباه است");
      return;
    }

    onUnlocked();
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <h2 className="create-open-tab-dialog__title">ورود به تنظیمات</h2>
        <input
          type="password"
          className="create-open-tab-dialog__input"
          placeholder="رمز عبور"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && password.length > 0) {
              submit();
            }
          }}
          autoFocus
        />
        {errorMessage && <p className="create-open-tab-dialog__warning">{errorMessage}</p>}
        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onForgotPassword} disabled={isSubmitting}>
            رمز را فراموش کرده‌ام
          </button>
        </div>
        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            انصراف
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={submit}
            disabled={isSubmitting || password.length === 0}
          >
            ورود
          </button>
        </div>
      </div>
    </div>
  );
}
