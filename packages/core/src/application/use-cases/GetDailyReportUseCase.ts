import type { AccountingTransactionRepository } from "../../domain/ports/AccountingTransactionRepository";
import type { StaffRepository } from "../../domain/ports/StaffRepository";
import { AccountingSummaryService } from "../../domain/services/AccountingSummaryService";
import type { AccountingSummary } from "../../domain/services/AccountingSummaryService";

export interface GetDailyReportInput {
  rangeStart: Date;
  rangeEnd: Date;
}

export interface ReportTransactionLine {
  id: string;
  type: "table_income" | "ps_income" | "buffet_income" | "expense";
  amount: number;
  paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
  description: string | null;
  staffFullName: string;
  occurredAt: string;
}

export interface DailyReport {
  rangeStart: string;
  rangeEnd: string;
  summary: AccountingSummary;
  transactions: ReportTransactionLine[];
}

export class GetDailyReportUseCase {
  constructor(
    private readonly accountingTransactionRepository: AccountingTransactionRepository,
    private readonly staffRepository: StaffRepository,
    private readonly accountingSummaryService: AccountingSummaryService = new AccountingSummaryService()
  ) {}

  execute(input: GetDailyReportInput): DailyReport {
    const rangeStartIso = input.rangeStart.toISOString();
    const rangeEndIso = input.rangeEnd.toISOString();

    const transactions = this.accountingTransactionRepository.findBetween(
      rangeStartIso,
      rangeEndIso
    );

    const staffNameCache = new Map<string, string>();
    function resolveStaffName(staffId: string, staffRepository: StaffRepository): string {
      const cached = staffNameCache.get(staffId);
      if (cached) {
        return cached;
      }
      const staff = staffRepository.findById(staffId);
      const name = staff?.fullName ?? "-";
      staffNameCache.set(staffId, name);
      return name;
    }

    const transactionLines: ReportTransactionLine[] = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      staffFullName: resolveStaffName(transaction.staffId, this.staffRepository),
      occurredAt: transaction.occurredAt,
    }));

    return {
      rangeStart: rangeStartIso,
      rangeEnd: rangeEndIso,
      summary: this.accountingSummaryService.summarize(transactions),
      transactions: transactionLines,
    };
  }
}
