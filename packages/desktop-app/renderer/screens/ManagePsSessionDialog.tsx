import { useEffect, useState } from "react";
import "./create-open-tab-dialog.css";
import { PaymentMethodDialog, type PaymentMethod } from "./PaymentMethodDialog";

interface ManagePsSessionDialogProps {
  deviceId: string;
  deviceName: string;
  onEnded: () => void;
  onChanged: () => void;
  onCancel: () => void;
}

const CONTROLLER_OPTIONS = [1, 2, 3, 4];

export function ManagePsSessionDialog({
  deviceId,
  deviceName,
  onEnded,
  onChanged,
  onCancel,
}: ManagePsSessionDialogProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [controllerCount, setControllerCount] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChoosingPaymentMethod, setIsChoosingPaymentMethod] = useState(false);

  useEffect(() => {
    window.arthurClub.getActivePsSession(deviceId).then((session) => {
      setSessionId(session?.sessionId ?? null);
      setControllerCount(session?.controllerCount ?? null);
    });
  }, [deviceId]);

  async function changeControllerCount(newCount: number) {
    if (!sessionId || newCount === controllerCount) {
      return;
    }
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await window.arthurClub.changePsSessionControllerCount({
        sessionId,
        newControllerCount: newCount,
      });
      setControllerCount(newCount);
      onChanged();
    } catch {
      setErrorMessage("تغییر تعداد دسته با خطا مواجه شد");
    } finally {
      setIsBusy(false);
    }
  }

  async function endSession(paymentMethod: PaymentMethod) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await window.arthurClub.endPsSession({ deviceId, paymentMethod });
      onEnded();
    } catch {
      setErrorMessage("پایان جلسه با خطا مواجه شد");
      setIsChoosingPaymentMethod(false);
    } finally {
      setIsBusy(false);
    }
  }

  if (isChoosingPaymentMethod) {
    return (
      <PaymentMethodDialog
        title={`روش پرداخت — ${deviceName}`}
        isBusy={isBusy}
        onSelect={endSession}
        onCancel={() => setIsChoosingPaymentMethod(false)}
      />
    );
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <h2 className="create-open-tab-dialog__title">مدیریت جلسه — {deviceName}</h2>

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
              onClick={() => changeControllerCount(count)}
              disabled={isBusy || sessionId === null}
            >
              {count} دسته
            </button>
          ))}
        </div>

        {errorMessage && <p className="create-open-tab-dialog__warning">{errorMessage}</p>}

        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isBusy}>
            بستن
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={() => setIsChoosingPaymentMethod(true)}
            disabled={isBusy || sessionId === null}
          >
            پایان جلسه
          </button>
        </div>
      </div>
    </div>
  );
}
