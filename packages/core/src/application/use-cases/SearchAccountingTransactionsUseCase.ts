import type {
  AccountingTransactionFilter,
  AccountingTransactionRepository,
} from "../../domain/ports/AccountingTransactionRepository";
import type { StaffRepository } from "../../domain/ports/StaffRepository";
import { AccountingSummaryService } from "../../domain/services/AccountingSummaryService";
import type { AccountingSummary } from "../../domain/services/AccountingSummaryService";
import type { ReportTransactionLine } from "./GetDailyReportUseCase";

export interface SearchAccountingTransactionsInput {
  rangeStart?: Date;
  rangeEnd?: Date;
  staffId?: string;
  type?: AccountingTransactionFilter["type"];
  paymentMethod?: AccountingTransactionFilter["paymentMethod"];
}

export interface SearchAccountingTransactionsResult {
  summary: AccountingSummary;
  transactions: ReportTransactionLine[];
}

export class SearchAccountingTransactionsUseCase {
  constructor(
    private readonly accountingTransactionRepository: AccountingTransactionRepository,
    private readonly staffRepository: StaffRepository,
    private readonly accountingSummaryService: AccountingSummaryService = new AccountingSummaryService()
  ) {}

  execute(input: SearchAccountingTransactionsInput): SearchAccountingTransactionsResult {
    const transactions = this.accountingTransactionRepository.search({
      startIso: input.rangeStart?.toISOString(),
      endIso: input.rangeEnd?.toISOString(),
      staffId: input.staffId,
      type: input.type,
      paymentMethod: input.paymentMethod,
    });

    const staffNameCache = new Map<string, string>();
    const resolveStaffName = (staffId: string): string => {
      const cached = staffNameCache.get(staffId);
      if (cached) {
        return cached;
      }
      const staff = this.staffRepository.findById(staffId);
      const name = staff?.fullName ?? "-";
      staffNameCache.set(staffId, name);
      return name;
    };

    const transactionLines: ReportTransactionLine[] = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      staffFullName: resolveStaffName(transaction.staffId),
      occurredAt: transaction.occurredAt,
    }));

    return {
      summary: this.accountingSummaryService.summarize(transactions),
      transactions: transactionLines,
    };
  }
}
