import type {
  EntryScreenData,
  OpenTabSummaryDto,
  LedgerAccountSummaryDto,
  CreateOpenTabResultDto,
  ProductDto,
  ProductCategoryDto,
  CreateBuffetOrderResultDto,
  SecurityStatusDto,
  VerifyPasswordResultDto,
  DailyReportDto,
  BackupHistoryEntryDto,
  CreateBackupResultDto,
  RestoreBackupResultDto,
  ActivePsSessionDto,
  ActiveTableSessionDto,
  EndPsSessionResultDto,
  StaffOptionDto,
  SearchAccountingTransactionsResultDto,
  TableTypeDto,
  TableDto,
  DeviceDto,
  DeviceControllerRateDto,
} from "../preload/index";
import type { HomeScreenTable, HomeScreenDevice } from "./screens/HomeScreen";

declare global {
  interface Window {
    arthurClub: {
      getEntryScreenData: () => Promise<EntryScreenData>;
      setCurrentStaff: (staffId: string) => Promise<void>;
      createStaff: (input: { fullName: string }) => Promise<string>;
      deactivateStaff: (staffId: string) => Promise<void>;
      listTableTypes: () => Promise<TableTypeDto[]>;
      createTableType: (input: { name: string; hourlyRate: number }) => Promise<string>;
      updateTableTypeRate: (input: { id: string; hourlyRate: number }) => Promise<void>;
      createTable: (input: { name: string; tableTypeId: string }) => Promise<string>;
      deactivateTable: (tableId: string) => Promise<void>;
      listTables: () => Promise<TableDto[]>;
      createDevice: (input: {
        name: string;
        deviceType: "ps4" | "ps5";
        maxControllers?: number;
      }) => Promise<string>;
      deactivateDevice: (deviceId: string) => Promise<void>;
      listDevices: () => Promise<DeviceDto[]>;
      listDeviceControllerRates: (deviceType: "ps4" | "ps5") => Promise<DeviceControllerRateDto[]>;
      setDeviceControllerRate: (input: {
        deviceType: "ps4" | "ps5";
        controllerCount: number;
        hourlyRate: number;
      }) => Promise<void>;
      getHomeScreenData: () => Promise<{ tables: HomeScreenTable[]; devices: HomeScreenDevice[] }>;
      toggleTableSession: (input: { tableId: string; openTabId?: string }) => Promise<void>;
      getActiveTableSession: (tableId: string) => Promise<ActiveTableSessionDto | null>;
      endTableSession: (input: {
        tableId: string;
        paymentMethod?: "cash" | "pos" | "card_to_card" | "ledger";
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
      listLedgerAccounts: (namePrefix?: string) => Promise<LedgerAccountSummaryDto[]>;
      recordLedgerPayment: (input: {
        ledgerAccountId: string;
        amount: number;
        method: "cash" | "pos" | "card_to_card";
      }) => Promise<void>;
      listProducts: () => Promise<ProductDto[]>;
      listProductCategories: () => Promise<ProductCategoryDto[]>;
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
      startPsSession: (input: {
        deviceId: string;
        controllerCount: number;
        openTabId?: string;
      }) => Promise<string>;
      changePsSessionControllerCount: (input: {
        sessionId: string;
        newControllerCount: number;
      }) => Promise<void>;
      endPsSession: (input: {
        deviceId: string;
        paymentMethod?: "cash" | "pos" | "card_to_card" | "ledger";
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


