import { useEffect, useState } from "react";
import { formatTomanWithSeparators } from "../../../core/src/localization/CurrencyFormatter";
import type {
  SearchAccountingTransactionsResultDto,
  StaffOptionDto,
} from "../../preload/index";
import { JalaliDateField } from "../design-system/JalaliDateField";
import { formatJalaliDateTimeLabel, jalaliToIsoStartOfDay, isoToJalaliParts } from "../utils/formatJalaliDateTime";
import "./reports-screen.css";
import "./transactions-screen.css";

interface TransactionsScreenProps {
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  table_income: "درآمد میز",
  ps_income: "درآمد PS",
  buffet_income: "درآمد بوفه",
  expense: "هزینه",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقدی",
  pos: "کارت‌خوان",
  card_to_card: "کارت‌به‌کارت",
  ledger: "حساب دفتری",
};

export function TransactionsScreen({ onClose }: TransactionsScreenProps) {
  const [staffOptions, setStaffOptions] = useState<StaffOptionDto[]>([]);
  const [rangeStart, setRangeStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return isoToJalaliParts(date.toISOString());
  });
  const [rangeEnd, setRangeEnd] = useState(() => isoToJalaliParts(new Date().toISOString()));
  const [staffId, setStaffId] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [result, setResult] = useState<SearchAccountingTransactionsResultDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.arthurClub.listAllActiveStaff().then(setStaffOptions);
  }, []);

  function runSearch() {
    setIsLoading(true);
    const startIso = jalaliToIsoStartOfDay(rangeStart.year, rangeStart.month, rangeStart.day);
    const endIso = new Date(
      new Date(jalaliToIsoStartOfDay(rangeEnd.year, rangeEnd.month, rangeEnd.day)).getTime() +
        24 * 60 * 60 * 1000
    ).toISOString();

    window.arthurClub
      .searchTransactions({
        rangeStart: startIso,
        rangeEnd: endIso,
        staffId: staffId || undefined,
        type: (type || undefined) as
          | "table_income"
          | "ps_income"
          | "buffet_income"
          | "expense"
          | undefined,
        paymentMethod: (paymentMethod || undefined) as
          | "cash"
          | "pos"
          | "card_to_card"
          | "ledger"
          | undefined,
      })
      .then((data) => {
        setResult(data);
        setIsLoading(false);
      });
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="reports-screen">
      <div className="reports-screen__header">
        <button type="button" className="reports-screen__back-button" onClick={onClose}>
          بازگشت
        </button>
        <h1 className="reports-screen__title">تراکنش‌ها</h1>
      </div>

      <div className="reports-screen__content">
        <div className="transactions-screen__filters">
          <JalaliDateField
            year={rangeStart.year}
            month={rangeStart.month}
            day={rangeStart.day}
            onChange={setRangeStart}
          />
          <JalaliDateField
            year={rangeEnd.year}
            month={rangeEnd.month}
            day={rangeEnd.day}
            onChange={setRangeEnd}
          />
          <select
            className="transactions-screen__filter-input"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
          >
            <option value="">همهٔ پرسنل</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullName}
              </option>
            ))}
          </select>
          <select
            className="transactions-screen__filter-input"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">همهٔ انواع</option>
            <option value="table_income">درآمد میز</option>
            <option value="ps_income">درآمد PS</option>
            <option value="buffet_income">درآمد بوفه</option>
            <option value="expense">هزینه</option>
          </select>
          <select
            className="transactions-screen__filter-input"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="">همهٔ روش‌های پرداخت</option>
            <option value="cash">نقدی</option>
            <option value="pos">کارت‌خوان</option>
            <option value="card_to_card">کارت‌به‌کارت</option>
            <option value="ledger">حساب دفتری</option>
          </select>
          <button
            type="button"
            className="transactions-screen__search-button"
            onClick={runSearch}
            disabled={isLoading}
          >
            جست‌وجو
          </button>
        </div>

        {result && (
          <>
            <div className="reports-screen__summary-grid">
              <div className="reports-screen__summary-card reports-screen__summary-card--income">
                <div className="reports-screen__summary-label">کل درآمد</div>
                <div className="reports-screen__summary-value">
                  {formatTomanWithSeparators(result.summary.totalIncome)}
                </div>
              </div>
              <div className="reports-screen__summary-card reports-screen__summary-card--expense">
                <div className="reports-screen__summary-label">کل هزینه</div>
                <div className="reports-screen__summary-value">
                  {formatTomanWithSeparators(result.summary.totalExpense)}
                </div>
              </div>
              <div className="reports-screen__summary-card">
                <div className="reports-screen__summary-label">خالص</div>
                <div className="reports-screen__summary-value">
                  {formatTomanWithSeparators(result.summary.netAmount)}
                </div>
              </div>
            </div>

            <div className="reports-screen__transactions">
              <div className="reports-screen__breakdown-title">
                {result.transactions.length} تراکنش
              </div>
              {result.transactions.length === 0 && (
                <div className="reports-screen__empty">تراکنشی با این فیلترها یافت نشد</div>
              )}
              {result.transactions.map((transaction) => (
                <div key={transaction.id} className="reports-screen__transaction-row">
                  <span className="reports-screen__transaction-type">
                    {TYPE_LABELS[transaction.type]}
                  </span>
                  <span className="reports-screen__transaction-occurred-at">
                    {formatJalaliDateTimeLabel(transaction.occurredAt)}
                  </span>
                  <span className="reports-screen__transaction-staff">
                    {transaction.staffFullName}
                  </span>
                  <span className="reports-screen__transaction-method">
                    {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                  </span>
                  <span className="reports-screen__transaction-amount">
                    {formatTomanWithSeparators(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
