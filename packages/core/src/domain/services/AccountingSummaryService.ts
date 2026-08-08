import type { AccountingTransactionRecord } from "../ports/AccountingTransactionRepository";

export interface AccountingSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  tableIncome: number;
  psIncome: number;
  buffetIncome: number;
  cashTotal: number;
  posTotal: number;
  cardToCardTotal: number;
  ledgerTotal: number;
  transactionCount: number;
}

export class AccountingSummaryService {
  summarize(transactions: AccountingTransactionRecord[]): AccountingSummary {
    const summary: AccountingSummary = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      tableIncome: 0,
      psIncome: 0,
      buffetIncome: 0,
      cashTotal: 0,
      posTotal: 0,
      cardToCardTotal: 0,
      ledgerTotal: 0,
      transactionCount: transactions.length,
    };

    for (const transaction of transactions) {
      if (transaction.type === "expense") {
        summary.totalExpense += transaction.amount;
      } else {
        summary.totalIncome += transaction.amount;
        if (transaction.type === "table_income") {
          summary.tableIncome += transaction.amount;
        } else if (transaction.type === "ps_income") {
          summary.psIncome += transaction.amount;
        } else if (transaction.type === "buffet_income") {
          summary.buffetIncome += transaction.amount;
        }
      }

      if (transaction.paymentMethod === "cash") {
        summary.cashTotal += transaction.amount;
      } else if (transaction.paymentMethod === "pos") {
        summary.posTotal += transaction.amount;
      } else if (transaction.paymentMethod === "card_to_card") {
        summary.cardToCardTotal += transaction.amount;
      } else if (transaction.paymentMethod === "ledger") {
        summary.ledgerTotal += transaction.amount;
      }
    }

    summary.netAmount = summary.totalIncome - summary.totalExpense;

    return summary;
  }
}
