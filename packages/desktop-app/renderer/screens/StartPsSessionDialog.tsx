import { useState } from "react";
import "./create-open-tab-dialog.css";

interface StartPsSessionDialogProps {
  deviceName: string;
  onStarted: () => void;
  onCancel: () => void;
  deviceId: string;
}

const CONTROLLER_OPTIONS = [1, 2, 3, 4];

export function StartPsSessionDialog({
  deviceName,
  deviceId,
  onStarted,
  onCancel,
}: StartPsSessionDialogProps) {
  const [controllerCount, setControllerCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await window.arthurClub.startPsSession({ deviceId, controllerCount });
      onStarted();
    } catch {
      setErrorMessage("شروع جلسه با خطا مواجه شد");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <h2 className="create-open-tab-dialog__title">شروع جلسه — {deviceName}</h2>

        <div className="create-open-tab-dialog__controller-options">
          {CONTROLLER_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              className={
                count === controllerCount
                  ? "create-open-tab-dialog__controller-option create-open-tab-dialog__controller-option--selected"
                  : "create-open-tab-dialog__controller-option"
              }
              onClick={() => setControllerCount(count)}
              disabled={isSubmitting}
            >
              {count} دسته
            </button>
          ))}
        </div>

        {errorMessage && <p className="create-open-tab-dialog__warning">{errorMessage}</p>}

        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            انصراف
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={submit}
            disabled={isSubmitting}
          >
            شروع
          </button>
        </div>
      </div>
    </div>
  );
}
