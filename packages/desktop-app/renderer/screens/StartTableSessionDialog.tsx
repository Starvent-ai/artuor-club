import { useState } from "react";
import { OpenTabPicker } from "../design-system/OpenTabPicker";
import "./create-open-tab-dialog.css";

interface StartTableSessionDialogProps {
  tableId: string;
  tableName: string;
  onStarted: () => void;
  onCancel: () => void;
}

type Step = "choose_mode" | "pick_open_tab";

export function StartTableSessionDialog({
  tableId,
  tableName,
  onStarted,
  onCancel,
}: StartTableSessionDialogProps) {
  const [step, setStep] = useState<Step>("choose_mode");
  const [isBusy, setIsBusy] = useState(false);

  async function start(openTabId?: string) {
    setIsBusy(true);
    try {
      await window.arthurClub.toggleTableSession({ tableId, openTabId });
      onStarted();
    } finally {
      setIsBusy(false);
    }
  }

  if (step === "pick_open_tab") {
    return (
      <div className="create-open-tab-dialog__overlay">
        <div className="create-open-tab-dialog">
          <div className="create-open-tab-dialog__title">{tableName}</div>
          <OpenTabPicker onSelected={(openTabId) => start(openTabId)} />
          <div className="create-open-tab-dialog__actions">
            <button type="button" onClick={() => setStep("choose_mode")} disabled={isBusy}>
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
        <div className="create-open-tab-dialog__title">{tableName}</div>
        <div className="create-open-tab-dialog__subtitle">بازی روی این میز چگونه شروع شود؟</div>
        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isBusy}>
            انصراف
          </button>
          <button type="button" onClick={() => setStep("pick_open_tab")} disabled={isBusy}>
            اتصال به حساب مشتری
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={() => start(undefined)}
            disabled={isBusy}
          >
            شروع فوری
          </button>
        </div>
      </div>
    </div>
  );
}
