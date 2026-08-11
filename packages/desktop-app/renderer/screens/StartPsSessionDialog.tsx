import { useState } from "react";
import { OpenTabPicker } from "../design-system/OpenTabPicker";
import "./create-open-tab-dialog.css";

interface StartPsSessionDialogProps {
  deviceName: string;
  onStarted: () => void;
  onCancel: () => void;
  deviceId: string;
}

type Step = "choose_controllers" | "pick_open_tab";

const CONTROLLER_OPTIONS = [1, 2, 3, 4];

export function StartPsSessionDialog({
  deviceName,
  deviceId,
  onStarted,
  onCancel,
}: StartPsSessionDialogProps) {
  const [step, setStep] = useState<Step>("choose_controllers");
  const [controllerCount, setControllerCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(openTabId?: string) {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await window.arthurClub.startPsSession({ deviceId, controllerCount, openTabId });
      onStarted();
    } catch {
      setErrorMessage("شروع جلسه با خطا مواجه شد");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "pick_open_tab") {
    return (
      <div className="create-open-tab-dialog__overlay">
        <div className="create-open-tab-dialog">
          <h2 className="create-open-tab-dialog__title">شروع جلسه — {deviceName}</h2>
          <OpenTabPicker onSelected={(openTabId) => submit(openTabId)} />
          {errorMessage && <p className="create-open-tab-dialog__warning">{errorMessage}</p>}
          <div className="create-open-tab-dialog__actions">
            <button type="button" onClick={() => setStep("choose_controllers")} disabled={isSubmitting}>
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
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
          <button type="button" onClick={() => setStep("pick_open_tab")} disabled={isSubmitting}>
            اتصال به حساب مشتری
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={() => submit(undefined)}
            disabled={isSubmitting}
          >
            شروع فوری
          </button>
        </div>
      </div>
    </div>
  );
}
