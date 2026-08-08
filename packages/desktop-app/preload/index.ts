import { contextBridge, ipcRenderer } from "electron";

export interface EntryScreenData {
  entryScreen: "main_application" | "staff_selection";
  staffOptions: { id: string; fullName: string; isActive: boolean }[];
}

export interface OpenTabSummaryDto {
  openTabId: string;
  customerId: string;
  customerFullName: string;
  totalAmount: number;
  paidAmount: number;
  openedAt: string;
}

export type CreateOpenTabResultDto =
  | { status: "needs_confirmation"; similarCustomers: { id: string; fullName: string }[] }
  | { status: "created"; openTabId: string; customerId: string };

export interface ProductDto {
  id: string;
  name: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface CreateBuffetOrderResultDto {
  buffetOrderId: string;
  totalAmount: number;
  lowStockProductIds: string[];
}

export interface SecurityStatusDto {
  isPasswordSet: boolean;
  securityQuestion: string | null;
}

export interface VerifyPasswordResultDto {
  isPasswordSet: boolean;
  isValid: boolean;
}

export interface ReportTransactionLineDto {
  id: string;
  type: "table_income" | "ps_income" | "buffet_income" | "expense";
  amount: number;
  paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
  description: string | null;
  staffFullName: string;
  occurredAt: string;
}

export interface AccountingSummaryDto {
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

export interface DailyReportDto {
  rangeStart: string;
  rangeEnd: string;
  summary: AccountingSummaryDto;
  transactions: ReportTransactionLineDto[];
}

export interface BackupHistoryEntryDto {
  id: string;
  type: "automatic" | "manual";
  filePath: string;
  createdAt: string;
  status: "success" | "failed";
}

export type CreateBackupResultDto =
  | { status: "cancelled" }
  | { status: "success"; filePath: string }
  | { status: "failed" };

export type RestoreBackupResultDto = { status: "cancelled" } | { status: "success" };

export interface StaffOptionDto {
  id: string;
  fullName: string;
  isActive: boolean;
}

export interface SearchAccountingTransactionsResultDto {
  summary: AccountingSummaryDto;
  transactions: ReportTransactionLineDto[];
}

export interface ActivePsSessionDto {
  sessionId: string;
  controllerCount: number | null;
}

export interface EndPsSessionResultDto {
  totalBilledMinutes: number;
  amount: number;
  transactionRecorded: boolean;
}

contextBridge.exposeInMainWorld("arthurClub", {
  getEntryScreenData: (): Promise<EntryScreenData> => ipcRenderer.invoke("staff:getEntryScreenData"),
  setCurrentStaff: (staffId: string): Promise<void> => ipcRenderer.invoke("staff:setCurrentStaff", staffId),
  getHomeScreenData: () => ipcRenderer.invoke("home:getScreenData"),
  toggleTableSession: (tableId: string) => ipcRenderer.invoke("table:toggleSession", tableId),
  endTableSession: (input: {
    tableId: string;
    paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
  }) => ipcRenderer.invoke("table:endSession", input),
  listOpenTabs: (namePrefix?: string): Promise<OpenTabSummaryDto[]> =>
    ipcRenderer.invoke("openTab:list", namePrefix),
  createOpenTab: (input: {
    customerName: string;
    phoneNumber?: string;
    confirmedDespiteSimilarName?: boolean;
  }): Promise<CreateOpenTabResultDto> => ipcRenderer.invoke("openTab:create", input),
  settleOpenTab: (input: {
    openTabId: string;
    method: "cash" | "pos" | "card_to_card" | "ledger";
  }): Promise<void> => ipcRenderer.invoke("openTab:settle", input),
  listProducts: (): Promise<ProductDto[]> => ipcRenderer.invoke("product:listActive"),
  createProduct: (input: {
    name: string;
    categoryName: string;
    purchasePrice: number;
    salePrice: number;
    initialStock: number;
    lowStockThreshold: number;
  }): Promise<string> => ipcRenderer.invoke("product:create", input),
  createBuffetOrder: (input: {
    items: { productId: string; quantity: number }[];
    openTabId?: string;
    isPaidImmediately: boolean;
    paymentMethod?: "cash" | "pos" | "card_to_card";
  }): Promise<CreateBuffetOrderResultDto> => ipcRenderer.invoke("buffet:createOrder", input),
  getSecurityStatus: (): Promise<SecurityStatusDto> => ipcRenderer.invoke("security:getStatus"),
  setSecurityCredential: (input: {
    currentPassword?: string;
    newPassword: string;
    securityQuestion: string;
    securityAnswer: string;
  }): Promise<void> => ipcRenderer.invoke("security:setCredential", input),
  verifyPassword: (password: string): Promise<VerifyPasswordResultDto> =>
    ipcRenderer.invoke("security:verifyPassword", password),
  resetPasswordWithSecurityAnswer: (input: {
    securityAnswer: string;
    newPassword: string;
  }): Promise<void> => ipcRenderer.invoke("security:resetPasswordWithAnswer", input),
  getDailyReport: (input: { rangeStart: string; rangeEnd: string }): Promise<DailyReportDto> =>
    ipcRenderer.invoke("report:getDailyReport", input),
  listBackupHistory: (): Promise<BackupHistoryEntryDto[]> =>
    ipcRenderer.invoke("backup:listHistory"),
  createManualBackup: (): Promise<CreateBackupResultDto> =>
    ipcRenderer.invoke("backup:createManual"),
  restoreBackup: (): Promise<RestoreBackupResultDto> => ipcRenderer.invoke("backup:restore"),
  getActivePsSession: (deviceId: string): Promise<ActivePsSessionDto | null> =>
    ipcRenderer.invoke("ps:getActiveSession", deviceId),
  startPsSession: (input: { deviceId: string; controllerCount: number }): Promise<string> =>
    ipcRenderer.invoke("ps:startSession", input),
  changePsSessionControllerCount: (input: {
    sessionId: string;
    newControllerCount: number;
  }): Promise<void> => ipcRenderer.invoke("ps:changeControllerCount", input),
  endPsSession: (input: {
    deviceId: string;
    paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
  }): Promise<EndPsSessionResultDto> => ipcRenderer.invoke("ps:endSession", input),
  searchTransactions: (input: {
    rangeStart?: string;
    rangeEnd?: string;
    staffId?: string;
    type?: "table_income" | "ps_income" | "buffet_income" | "expense";
    paymentMethod?: "cash" | "pos" | "card_to_card" | "ledger";
  }): Promise<SearchAccountingTransactionsResultDto> =>
    ipcRenderer.invoke("transaction:search", input),
  listAllActiveStaff: (): Promise<StaffOptionDto[]> => ipcRenderer.invoke("staff:listAllActive"),
});


