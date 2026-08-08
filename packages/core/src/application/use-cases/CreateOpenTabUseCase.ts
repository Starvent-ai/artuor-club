import { randomUUID } from "node:crypto";
import type { CustomerRepository, CustomerRecord } from "../../domain/ports/CustomerRepository";
import type { OpenTabRepository } from "../../domain/ports/OpenTabRepository";

export interface CreateOpenTabInput {
  customerName: string;
  phoneNumber?: string | null;
  staffId: string;
  confirmedDespiteSimilarName?: boolean;
  now?: Date;
}

export type CreateOpenTabResult =
  | { status: "needs_confirmation"; similarCustomers: CustomerRecord[] }
  | { status: "created"; openTabId: string; customerId: string };

export class CreateOpenTabUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly openTabRepository: OpenTabRepository
  ) {}

  execute(input: CreateOpenTabInput): CreateOpenTabResult {
    if (!input.confirmedDespiteSimilarName) {
      const similarCustomers = this.customerRepository.findActiveTabCustomersBySimilarName(
        input.customerName
      );
      if (similarCustomers.length > 0) {
        return { status: "needs_confirmation", similarCustomers };
      }
    }

    const customerId = randomUUID();
    const now = input.now ?? new Date();

    this.customerRepository.create({
      id: customerId,
      fullName: input.customerName,
      phoneNumber: input.phoneNumber ?? null,
    });

    const openTabId = randomUUID();

    this.openTabRepository.create({
      id: openTabId,
      customerId,
      status: "active",
      openedAt: now.toISOString(),
      closedAt: null,
      totalAmount: 0,
      paidAmount: 0,
      staffId: input.staffId,
    });

    return { status: "created", openTabId, customerId };
  }
}
