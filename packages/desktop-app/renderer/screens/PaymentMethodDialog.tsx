import "./create-open-tab-dialog.css";

export type PaymentMethod = "cash" | "pos" | "card_to_card";

interface PaymentMethodDialogProps {
  title: string;
  onSelect: (method: PaymentMethod) => void;
  onCancel: () => void;
  isBusy?: boolean;
}

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "نقدی" },
  { value: "pos", label: "کارت‌خوان" },
  { value: "card_to_card", label: "کارت‌به‌کارت" },
];

export function PaymentMethodDialog({
  title,
  onSelect,
  onCancel,
  isBusy = false,
}: PaymentMethodDialogProps) {
  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <h2 className="create-open-tab-dialog__title">{title}</h2>

        <div className="create-open-tab-dialog__controller-options">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="create-open-tab-dialog__controller-option"
              onClick={() => onSelect(option.value)}
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
        </div>
      </div>
    </div>
  );
}
