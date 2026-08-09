import { useEffect, useState } from "react";
import { PremiumCard } from "../design-system/PremiumCard";
import { formatTomanWithSeparators } from "../../../core/src/localization/CurrencyFormatter";
import { formatJalaliDateLabel } from "../utils/formatJalaliDateTime";
import { RecordLedgerPaymentDialog } from "./RecordLedgerPaymentDialog";
import type { LedgerAccountSummaryDto } from "../../preload/index";
import "./open-tabs-screen.css";

interface LedgerScreenProps {
  onClose: () => void;
}

export function LedgerScreen({ onClose }: LedgerScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState<LedgerAccountSummaryDto[]>([]);
  const [accountPendingPayment, setAccountPendingPayment] = useState<LedgerAccountSummaryDto | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;
    window.arthurClub.listLedgerAccounts(searchTerm).then((result) => {
      if (!cancelled) {
        setAccounts(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchTerm, refreshCounter]);

  const totalOutstanding = accounts.reduce(
    (sum, account) => sum + (account.totalAmount - account.paidAmount),
    0
  );

  return (
    <div className="open-tabs-screen">
      <div className="open-tabs-screen__header">
        <button type="button" className="open-tabs-screen__back-button" onClick={onClose}>
          بازگشت
        </button>
        <input
          type="text"
          className="open-tabs-screen__search"
          placeholder="جستجوی نام مشتری"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          autoFocus
        />
      </div>

      <div className="open-tabs-screen__summary">
        مجموع مطالبات باز: {formatTomanWithSeparators(totalOutstanding)}
      </div>

      <div className="open-tabs-screen__grid">
        {accounts.map((account) => (
          <PremiumCard key={account.ledgerAccountId}>
            <div
              className="open-tabs-screen__tab-clickable"
              onClick={() => setAccountPendingPayment(account)}
            >
              <div className="open-tabs-screen__tab-name">{account.customerFullName}</div>
              <div className="open-tabs-screen__tab-opened-at">
                {formatJalaliDateLabel(account.openedAt)}
              </div>
              <div className="open-tabs-screen__tab-remaining">
                مانده: {formatTomanWithSeparators(account.totalAmount - account.paidAmount)}
              </div>
            </div>
          </PremiumCard>
        ))}
        {accounts.length === 0 && (
          <div className="open-tabs-screen__empty">حساب دفتری باز فعالی یافت نشد</div>
        )}
      </div>

      {accountPendingPayment && (
        <RecordLedgerPaymentDialog
          ledgerAccountId={accountPendingPayment.ledgerAccountId}
          customerFullName={accountPendingPayment.customerFullName}
          remainingAmount={accountPendingPayment.totalAmount - accountPendingPayment.paidAmount}
          onCancel={() => setAccountPendingPayment(null)}
          onRecorded={() => {
            setAccountPendingPayment(null);
            setRefreshCounter((count) => count + 1);
          }}
        />
      )}
    </div>
  );
}
