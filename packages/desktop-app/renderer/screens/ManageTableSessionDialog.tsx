import { useEffect, useState } from "react";
import "./create-open-tab-dialog.css";

interface ManageTableSessionDialogProps {
  tableId: string;
  tableName: string;
  onEndRequiresPayment: () => void;
  onEndedWithoutPayment: () => void;
  onCancel: () => void;
}

export function ManageTableSessionDialog({
  tableId,
  tableName,
  onEndRequiresPayment,
  onEndedWithoutPayment,
  onCancel,
}: ManageTableSessionDialogProps) {
  const [openTabId, setOpenTabId] = useState<string | null | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    window.arthurClub.getActiveTableSession(tableId).then((session) => {
      setOpenTabId(session?.openTabId ?? null);
    });
  }, [tableId]);

  async function endAttachedToTab() {
    setIsBusy(true);
    try {
      await window.arthurClub.endTableSession({ tableId });
      onEndedWithoutPayment();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <div className="create-open-tab-dialog__title">{tableName}</div>
        <div className="create-open-tab-dialog__subtitle">این میز در حال بازی است</div>
        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isBusy}>
            بستن
          </button>
          {openTabId === undefined && (
            <button type="button" className="create-open-tab-dialog__danger" disabled>
              در حال بررسی...
            </button>
          )}
          {openTabId === null && (
            <button
              type="button"
              className="create-open-tab-dialog__danger"
              onClick={onEndRequiresPayment}
            >
              پایان بازی
            </button>
          )}
          {openTabId && (
            <button
              type="button"
              className="create-open-tab-dialog__danger"
              onClick={endAttachedToTab}
              disabled={isBusy}
            >
              پایان بازی و افزودن به حساب مشتری
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
