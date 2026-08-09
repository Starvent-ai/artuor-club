import { useEffect, useState } from "react";
import { PremiumCard } from "../design-system/PremiumCard";
import { formatTomanWithSeparators } from "../../../core/src/localization/CurrencyFormatter";
import { formatJalaliDateLabel } from "../utils/formatJalaliDateTime";
import { CreateOpenTabDialog } from "./CreateOpenTabDialog";
import { SettleOpenTabDialog } from "./SettleOpenTabDialog";
import { AddBuffetOrderDialog } from "./AddBuffetOrderDialog";
import "./open-tabs-screen.css";

export interface OpenTabSummary {
  openTabId: string;
  customerId: string;
  customerFullName: string;
  totalAmount: number;
  paidAmount: number;
  openedAt: string;
}

interface OpenTabsScreenProps {
  onClose: () => void;
}

export function OpenTabsScreen({ onClose }: OpenTabsScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tabs, setTabs] = useState<OpenTabSummary[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tabPendingSettlement, setTabPendingSettlement] = useState<OpenTabSummary | null>(null);
  const [tabPendingBuffetOrder, setTabPendingBuffetOrder] = useState<OpenTabSummary | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;
    window.arthurClub.listOpenTabs(searchTerm).then((result) => {
      if (!cancelled) {
        setTabs(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchTerm, refreshCounter]);

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
        <button
          type="button"
          className="open-tabs-screen__create-button"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          حساب جدید
        </button>
      </div>

      <div className="open-tabs-screen__grid">
        {tabs.map((tab) => (
          <PremiumCard key={tab.openTabId}>
            <div
              className="open-tabs-screen__tab-clickable"
              onClick={() => setTabPendingSettlement(tab)}
            >
              <div className="open-tabs-screen__tab-name">{tab.customerFullName}</div>
              <div className="open-tabs-screen__tab-opened-at">{formatJalaliDateLabel(tab.openedAt)}</div>
              <div className="open-tabs-screen__tab-remaining">
                مانده: {formatTomanWithSeparators(tab.totalAmount - tab.paidAmount)}
              </div>
            </div>
            <button
              type="button"
              className="open-tabs-screen__buffet-button"
              onClick={(event) => {
                event.stopPropagation();
                setTabPendingBuffetOrder(tab);
              }}
            >
              افزودن از بوفه
            </button>
          </PremiumCard>
        ))}
        {tabs.length === 0 && <div className="open-tabs-screen__empty">حساب باز فعالی یافت نشد</div>}
      </div>

      {isCreateDialogOpen && (
        <CreateOpenTabDialog
          onCancel={() => setIsCreateDialogOpen(false)}
          onCreated={() => {
            setIsCreateDialogOpen(false);
            setRefreshCounter((count) => count + 1);
          }}
        />
      )}

      {tabPendingSettlement && (
        <SettleOpenTabDialog
          openTabId={tabPendingSettlement.openTabId}
          customerFullName={tabPendingSettlement.customerFullName}
          remainingAmount={formatTomanWithSeparators(
            tabPendingSettlement.totalAmount - tabPendingSettlement.paidAmount
          )}
          onCancel={() => setTabPendingSettlement(null)}
          onSettled={() => {
            setTabPendingSettlement(null);
            setRefreshCounter((count) => count + 1);
          }}
        />
      )}

      {tabPendingBuffetOrder && (
        <AddBuffetOrderDialog
          openTabId={tabPendingBuffetOrder.openTabId}
          onCancel={() => setTabPendingBuffetOrder(null)}
          onAdded={() => {
            setTabPendingBuffetOrder(null);
            setRefreshCounter((count) => count + 1);
          }}
        />
      )}
    </div>
  );
}

