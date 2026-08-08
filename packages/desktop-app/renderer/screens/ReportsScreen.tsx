import { useEffect, useState } from "react";
import { formatTomanWithSeparators } from "../../../core/src/localization/CurrencyFormatter";
import { gregorianToJalali, formatJalaliDate } from "../../../core/src/localization/JalaliCalendar";
import type { DailyReportDto } from "../../preload/index";
import "./reports-screen.css";

interface ReportsScreenProps {
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

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function endOfToday(): Date {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

function toJalaliLabel(date: Date): string {
  const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return formatJalaliDate(jalali);
}

export function ReportsScreen({ onClose }: ReportsScreenProps) {
  const [report, setReport] = useState<DailyReportDto | null>(null);
  const [rangeStart] = useState<Date>(startOfToday());
  const [rangeEnd] = useState<Date>(endOfToday());

  useEffect(() => {
    window.arthurClub
      .getDailyReport({
        rangeStart: rangeStart.toISOString(),
        rangeEnd: rangeEnd.toISOString(),
      })
      .then(setReport);
  }, [rangeStart, rangeEnd]);

  return (
    <div className="reports-screen">
      <div className="reports-screen__header">
        <button type="button" className="reports-screen__back-button" onClick={onClose}>
          بازگشت
        </button>
        <h1 className="reports-screen__title">گزارش امروز — {toJalaliLabel(rangeStart)}</h1>
      </div>

      {!report && <div className="reports-screen__empty">در حال بارگذاری...</div>}

      {report && (
        <div className="reports-screen__content">
          <div className="reports-screen__summary-grid">
            <div className="reports-screen__summary-card reports-screen__summary-card--income">
              <div className="reports-screen__summary-label">کل درآمد</div>
              <div className="reports-screen__summary-value">
                {formatTomanWithSeparators(report.summary.totalIncome)}
              </div>
            </div>
            <div className="reports-screen__summary-card reports-screen__summary-card--expense">
              <div className="reports-screen__summary-label">کل هزینه</div>
              <div className="reports-screen__summary-value">
                {formatTomanWithSeparators(report.summary.totalExpense)}
              </div>
            </div>
            <div className="reports-screen__summary-card">
              <div className="reports-screen__summary-label">خالص</div>
              <div className="reports-screen__summary-value">
                {formatTomanWithSeparators(report.summary.netAmount)}
              </div>
            </div>
          </div>

          <div className="reports-screen__breakdown-grid">
            <div className="reports-screen__breakdown-card">
              <div className="reports-screen__breakdown-title">به تفکیک منبع</div>
              <div className="reports-screen__breakdown-row">
                <span>میز</span>
                <span>{formatTomanWithSeparators(report.summary.tableIncome)}</span>
              </div>
              <div className="reports-screen__breakdown-row">
                <span>PS</span>
                <span>{formatTomanWithSeparators(report.summary.psIncome)}</span>
              </div>
              <div className="reports-screen__breakdown-row">
                <span>بوفه</span>
                <span>{formatTomanWithSeparators(report.summary.buffetIncome)}</span>
              </div>
            </div>

            <div className="reports-screen__breakdown-card">
              <div className="reports-screen__breakdown-title">به تفکیک روش پرداخت</div>
              <div className="reports-screen__breakdown-row">
                <span>نقدی</span>
                <span>{formatTomanWithSeparators(report.summary.cashTotal)}</span>
              </div>
              <div className="reports-screen__breakdown-row">
                <span>کارت‌خوان</span>
                <span>{formatTomanWithSeparators(report.summary.posTotal)}</span>
              </div>
              <div className="reports-screen__breakdown-row">
                <span>کارت‌به‌کارت</span>
                <span>{formatTomanWithSeparators(report.summary.cardToCardTotal)}</span>
              </div>
              <div className="reports-screen__breakdown-row">
                <span>حساب دفتری</span>
                <span>{formatTomanWithSeparators(report.summary.ledgerTotal)}</span>
              </div>
            </div>
          </div>

          <div className="reports-screen__transactions">
            <div className="reports-screen__breakdown-title">تراکنش‌ها</div>
            {report.transactions.length === 0 && (
              <div className="reports-screen__empty">تراکنشی ثبت نشده است</div>
            )}
            {report.transactions.map((transaction) => (
              <div key={transaction.id} className="reports-screen__transaction-row">
                <span className="reports-screen__transaction-type">
                  {TYPE_LABELS[transaction.type]}
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
        </div>
      )}
    </div>
  );
}
