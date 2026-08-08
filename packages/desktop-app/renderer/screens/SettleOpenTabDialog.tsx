import { useState } from "react";
import "./create-open-tab-dialog.css";

interface SettleOpenTabDialogProps {
  openTabId: string;
  customerFullName: string;
  remainingAmount: string;
  onSettled: () => void;
  onCancel: () => void;
}

const PAYMENT_METHODS: { value: "cash" | "pos" | "card_to_card" | "ledger"; label: string }[] = [
  { value: "cash", label: "نقدی" },
  { value: "pos", label: "کارت‌خوان" },
  { value: "card_to_card", label: "کارت‌به‌کارت" },
  { value: "ledger", label: "حساب دفتری" },
];

export function SettleOpenTabDialog({
  openTabId,
  customerFullName,
  remainingAmount,
  onSettled,
  onCancel,
}: SettleOpenTabDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function settle(method: "cash" | "pos" | "card_to_card" | "ledger") {
    setIsSubmitting(true);
    await window.arthurClub.settleOpenTab({ openTabId, method });
    setIsSubmitting(false);
    onSettled();
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <h2 className="create-open-tab-dialog__title">تسویه حساب {customerFullName}</h2>
        <p className="create-open-tab-dialog__warning">مبلغ باقی‌مانده: {remainingAmount}</p>
        <div className="create-open-tab-dialog__actions" style={{ flexWrap: "wrap" }}>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              className="create-open-tab-dialog__primary"
              disabled={isSubmitting}
              onClick={() => settle(method.value)}
            >
              {method.label}
            </button>
          ))}
        </div>
        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
