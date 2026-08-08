import { useState } from "react";
import "./create-open-tab-dialog.css";

interface SimilarCustomer {
  id: string;
  fullName: string;
}

interface CreateOpenTabDialogProps {
  onCreated: (openTabId: string) => void;
  onCancel: () => void;
}

export function CreateOpenTabDialog({ onCreated, onCancel }: CreateOpenTabDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [similarCustomers, setSimilarCustomers] = useState<SimilarCustomer[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(confirmedDespiteSimilarName: boolean) {
    setIsSubmitting(true);
    const result = await window.arthurClub.createOpenTab({
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      confirmedDespiteSimilarName,
    });
    setIsSubmitting(false);

    if (result.status === "needs_confirmation") {
      setSimilarCustomers(result.similarCustomers);
      return;
    }

    onCreated(result.openTabId);
  }

  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <h2 className="create-open-tab-dialog__title">حساب باز جدید</h2>

        {!similarCustomers && (
          <>
            <input
              className="create-open-tab-dialog__input"
              placeholder="نام مشتری"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              autoFocus
            />
            <input
              className="create-open-tab-dialog__input"
              placeholder="شماره موبایل (اختیاری)"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
            <div className="create-open-tab-dialog__actions">
              <button type="button" onClick={onCancel} disabled={isSubmitting}>
                انصراف
              </button>
              <button
                type="button"
                className="create-open-tab-dialog__primary"
                onClick={() => submit(false)}
                disabled={isSubmitting || customerName.trim().length === 0}
              >
                ایجاد حساب
              </button>
            </div>
          </>
        )}

        {similarCustomers && (
          <>
            <p className="create-open-tab-dialog__warning">
              مشتری با همین نام یک حساب باز فعال دارد. آیا منظور همان مشتری است؟
            </p>
            <ul className="create-open-tab-dialog__similar-list">
              {similarCustomers.map((customer) => (
                <li key={customer.id}>{customer.fullName}</li>
              ))}
            </ul>
            <div className="create-open-tab-dialog__actions">
              <button type="button" onClick={onCancel} disabled={isSubmitting}>
                انصراف
              </button>
              <button
                type="button"
                className="create-open-tab-dialog__primary"
                onClick={() => submit(true)}
                disabled={isSubmitting}
              >
                خیر، مشتری جدید است
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
