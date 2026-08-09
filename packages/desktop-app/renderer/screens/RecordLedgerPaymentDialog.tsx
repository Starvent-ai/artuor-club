import { useState } from "react";
import { formatTomanWithSeparators } from "../../../core/src/localization/CurrencyFormatter";
import "./create-open-tab-dialog.css";

interface RecordLedgerPaymentDialogProps {
  ledgerAccountId: string;
  customerFullName: string;
  remainingAmount: number;
  onCancel: () => void;
  onRecorded: () => void;
}

const PAYMENT_METHOD_OPTIONS: { value: "cash" | "pos" | "card_to_card"; label: string }[] = [
  { value: "cash", label: "نقدی" },
  { value: "pos", label: "کارت‌خوان" },
  { value: "card_to_card", label: "کارت‌به‌کارت" },
];

export function RecordLedgerPaymentDialog({
  ledgerAccountId,
  customerFullName,
  remainingAmount,
  onCancel,
  onRecorded,
}: RecordLedgerPaymentDialogProps) {
  const [amount, setAmount] = useState(String(remainingAmount));
  const [method, setMethod] = useState<"cash" | "pos" | "card_to_card">("cash");
  const [isBusy, setIsBusy] = useState(false);

  async function handleConfirm() {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }
    setIsBusy(true);
    try {
      await window.arthurClub.recordLedgerPayment({
        ledgerAccountId,
        amount: numericAmount,
        method,
      });
      onRecorded();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <div className="create-open-tab-dialog__title">{customerFullName}</div>
        <div className="create-open-tab-dialog__subtitle">
          مانده: {formatTomanWithSeparators(remainingAmount)}
        </div>

        <input
          type="text"
          inputMode="numeric"
          className="create-open-tab-dialog__input"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />

        <div className="create-open-tab-dialog__controller-options">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                method === option.value
                  ? "create-open-tab-dialog__controller-option create-open-tab-dialog__controller-option--selected"
                  : "create-open-tab-dialog__controller-option"
              }
              onClick={() => setMethod(option.value)}
              disabled={isBusy}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isBusy}>
            انصراف
          </button>
          <button
            type="button"
            className="create-open-tab-dialog__primary"
            onClick={handleConfirm}
            disabled={isBusy}
          >
            ثبت پرداخت
          </button>
        </div>
      </div>
    </div>
  );
}
