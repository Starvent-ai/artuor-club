import { useEffect, useState } from "react";
import type { OpenTabSummaryDto } from "../../preload/index";
import "./open-tab-picker.css";

interface OpenTabPickerProps {
  onSelected: (openTabId: string) => void;
}

export function OpenTabPicker({ onSelected }: OpenTabPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [matches, setMatches] = useState<OpenTabSummaryDto[]>([]);
  const [similarCustomers, setSimilarCustomers] = useState<{ id: string; fullName: string }[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    window.arthurClub.listOpenTabs(searchTerm).then((result) => {
      if (!cancelled) {
        setMatches(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  async function createNew(confirmedDespiteSimilarName: boolean) {
    setIsBusy(true);
    try {
      const result = await window.arthurClub.createOpenTab({
        customerName: searchTerm.trim(),
        confirmedDespiteSimilarName,
      });
      if (result.status === "needs_confirmation") {
        setSimilarCustomers(result.similarCustomers);
        return;
      }
      onSelected(result.openTabId);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="open-tab-picker">
      <input
        type="text"
        className="open-tab-picker__search"
        placeholder="نام مشتری را جستجو کنید"
        value={searchTerm}
        onChange={(event) => {
          setSearchTerm(event.target.value);
          setSimilarCustomers([]);
        }}
        autoFocus
      />

      <div className="open-tab-picker__list">
        {matches.map((tab) => (
          <button
            key={tab.openTabId}
            type="button"
            className="open-tab-picker__item"
            onClick={() => onSelected(tab.openTabId)}
          >
            {tab.customerFullName}
          </button>
        ))}
      </div>

      {searchTerm.trim().length > 0 && (
        <>
          {similarCustomers.length > 0 && (
            <div className="open-tab-picker__warning">
              مشتری مشابه یافت شد: {similarCustomers.map((customer) => customer.fullName).join("، ")}
            </div>
          )}
          <button
            type="button"
            className="open-tab-picker__create"
            onClick={() => createNew(similarCustomers.length > 0)}
            disabled={isBusy}
          >
            {similarCustomers.length > 0
              ? "بله، مشتری جدید است"
              : `ایجاد حساب جدید برای «${searchTerm.trim()}»`}
          </button>
        </>
      )}
    </div>
  );
}
