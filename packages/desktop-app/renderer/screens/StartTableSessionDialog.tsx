import { useState } from "react";
import "./create-open-tab-dialog.css";

interface StartTableSessionDialogProps {
  tableId: string;
  tableName: string;
  onStarted: () => void;
  onCancel: () => void;
}

export function StartTableSessionDialog({
  tableId,
  tableName,
  onStarted,
  onCancel,
}: StartTableSessionDialogProps) {
  const [isBusy, setIsBusy] = useState(false);

  async function handleStart() {
    setIsBusy(true);
    try {
      await window.arthurClub.toggleTableSession(tableId);
      onStarted();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <div className="create-open-tab-dialog__title">{tableName}</div>
        <div className="create-open-tab-dialog__subtitle">بازی روی این میز شروع شود؟</div>
        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isBusy}>
            انصراف
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={handleStart}
            disabled={isBusy}
          >
            شروع بازی
          </button>
        </div>
      </div>
    </div>
  );
}
