import type {
  EntryScreenData,
  OpenTabSummaryDto,
  CreateOpenTabResultDto,
  ProductDto,
  CreateBuffetOrderResultDto,
  SecurityStatusDto,
  VerifyPasswordResultDto,
  DailyReportDto,
  BackupHistoryEntryDto,
  CreateBackupResultDto,
  RestoreBackupResultDto,
  ActivePsSessionDto,
  EndPsSessionResultDto,
  StaffOptionDto,
  SearchAccountingTransactionsResultDto,
} from "../preload/index";
import type { HomeScreenTable, HomeScreenDevice } from "./screens/HomeScreen";

declare global {
  interface Window {
    arthurClub: {
      getEntryScreenData: () => Promise<EntryScreenData>;
      setCurrentStaff: (staffId: string) => Promise<void>;
      getHomeScreenData: () => Promise<{ tables: HomeScreenTable[]; devices: HomeScreenDevice[] }>;
      toggleTableSession: (tableId: string) => Promise<void>;
      endTableSession: (input: {
        tableId: string;
        paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
      }) => Promise<void>;
      listOpenTabs: (namePrefix?: string) => Promise<OpenTabSummaryDto[]>;
      createOpenTab: (input: {
        customerName: string;
        phoneNumber?: string;
        confirmedDespiteSimilarName?: boolean;
      }) => Promise<CreateOpenTabResultDto>;
      settleOpenTab: (input: {
        openTabId: string;
        method: "cash" | "pos" | "card_to_card" | "ledger";
      }) => Promise<void>;
      listProducts: () => Promise<ProductDto[]>;
      createProduct: (input: {
        name: string;
        categoryName: string;
        purchasePrice: number;
        salePrice: number;
        initialStock: number;
        lowStockThreshold: number;
      }) => Promise<string>;
      createBuffetOrder: (input: {
        items: { productId: string; quantity: number }[];
        openTabId?: string;
        isPaidImmediately: boolean;
        paymentMethod?: "cash" | "pos" | "card_to_card";
      }) => Promise<CreateBuffetOrderResultDto>;
      getSecurityStatus: () => Promise<SecurityStatusDto>;
      setSecurityCredential: (input: {
        currentPassword?: string;
        newPassword: string;
        securityQuestion: string;
        securityAnswer: string;
      }) => Promise<void>;
      verifyPassword: (password: string) => Promise<VerifyPasswordResultDto>;
      resetPasswordWithSecurityAnswer: (input: {
        securityAnswer: string;
        newPassword: string;
      }) => Promise<void>;
      getDailyReport: (input: { rangeStart: string; rangeEnd: string }) => Promise<DailyReportDto>;
      listBackupHistory: () => Promise<BackupHistoryEntryDto[]>;
      createManualBackup: () => Promise<CreateBackupResultDto>;
      restoreBackup: () => Promise<RestoreBackupResultDto>;
      getActivePsSession: (deviceId: string) => Promise<ActivePsSessionDto | null>;
      startPsSession: (input: { deviceId: string; controllerCount: number }) => Promise<string>;
      changePsSessionControllerCount: (input: {
        sessionId: string;
        newControllerCount: number;
      }) => Promise<void>;
      endPsSession: (input: {
        deviceId: string;
        paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
      }) => Promise<EndPsSessionResultDto>;
      searchTransactions: (input: {
        rangeStart?: string;
        rangeEnd?: string;
        staffId?: string;
        type?: "table_income" | "ps_income" | "buffet_income" | "expense";
        paymentMethod?: "cash" | "pos" | "card_to_card" | "ledger";
      }) => Promise<SearchAccountingTransactionsResultDto>;
      listAllActiveStaff: () => Promise<StaffOptionDto[]>;
    };
  }
}


