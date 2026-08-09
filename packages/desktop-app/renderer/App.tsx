import { useEffect, useState } from "react";
import { SplashScreen } from "./screens/SplashScreen";
import { StaffSelectionScreen } from "./screens/StaffSelectionScreen";
import { HomeScreen, HomeScreenTable, HomeScreenDevice } from "./screens/HomeScreen";
import { OpenTabsScreen } from "./screens/OpenTabsScreen";
import { PasswordPromptDialog } from "./screens/PasswordPromptDialog";
import { ForgotPasswordDialog } from "./screens/ForgotPasswordDialog";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { TransactionsScreen } from "./screens/TransactionsScreen";
import { LedgerScreen } from "./screens/LedgerScreen";
import { StartPsSessionDialog } from "./screens/StartPsSessionDialog";
import { ManagePsSessionDialog } from "./screens/ManagePsSessionDialog";
import { StartTableSessionDialog } from "./screens/StartTableSessionDialog";
import { ManageTableSessionDialog } from "./screens/ManageTableSessionDialog";
import { PaymentMethodDialog } from "./screens/PaymentMethodDialog";

type AppPhase =
  | "splash"
  | "staff_selection"
  | "main_application"
  | "open_tabs"
  | "settings"
  | "reports"
  | "transactions"
  | "ledger";

interface StaffOption {
  id: string;
  fullName: string;
}

interface AppProps {
  entryScreen: "main_application" | "staff_selection";
  staffOptions: StaffOption[];
  onStaffSelected: (staffId: string) => void;
}

export function App({ entryScreen, staffOptions, onStaffSelected }: AppProps) {
  const [phase, setPhase] = useState<AppPhase>("splash");
  const [tables, setTables] = useState<HomeScreenTable[]>([]);
  const [devices, setDevices] = useState<HomeScreenDevice[]>([]);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tableIdPendingPayment, setTableIdPendingPayment] = useState<string | null>(null);
  const [isEndingTableSession, setIsEndingTableSession] = useState(false);

  function refreshHomeScreenData() {
    window.arthurClub.getHomeScreenData().then((data) => {
      setTables(data.tables);
      setDevices(data.devices);
    });
  }

  useEffect(() => {
    if (phase !== "main_application") {
      return;
    }
    refreshHomeScreenData();
  }, [phase]);

  if (phase === "splash") {
    return <SplashScreen onFinished={() => setPhase(entryScreen)} />;
  }

  if (phase === "staff_selection") {
    return (
      <StaffSelectionScreen
        staffOptions={staffOptions}
        onSelect={(staffId) => {
          onStaffSelected(staffId);
          setPhase("main_application");
        }}
      />
    );
  }

  if (phase === "open_tabs") {
    return <OpenTabsScreen onClose={() => setPhase("main_application")} />;
  }

  if (phase === "settings") {
    return <SettingsScreen onClose={() => setPhase("main_application")} />;
  }

  if (phase === "reports") {
    return <ReportsScreen onClose={() => setPhase("main_application")} />;
  }

  if (phase === "transactions") {
    return <TransactionsScreen onClose={() => setPhase("main_application")} />;
  }

  if (phase === "ledger") {
    return <LedgerScreen onClose={() => setPhase("main_application")} />;
  }

  async function openSettings() {
    const status = await window.arthurClub.getSecurityStatus();
    if (status.isPasswordSet) {
      setIsPasswordPromptOpen(true);
    } else {
      setPhase("settings");
    }
  }

  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) ?? null;
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;

  function handleTableClick(tableId: string) {
    setSelectedTableId(tableId);
  }

  async function endTableSessionWithPayment(paymentMethod: "cash" | "pos" | "card_to_card") {
    if (!tableIdPendingPayment) {
      return;
    }
    setIsEndingTableSession(true);
    try {
      await window.arthurClub.endTableSession({
        tableId: tableIdPendingPayment,
        paymentMethod,
      });
      setTableIdPendingPayment(null);
      refreshHomeScreenData();
    } finally {
      setIsEndingTableSession(false);
    }
  }

  return (
    <>
      <HomeScreen
        tables={tables}
        devices={devices}
        onTableClick={handleTableClick}
        onDeviceClick={(deviceId) => setSelectedDeviceId(deviceId)}
        onOpenTabsClick={() => setPhase("open_tabs")}
        onSettingsClick={openSettings}
        onReportsClick={() => setPhase("reports")}
        onTransactionsClick={() => setPhase("transactions")}
        onLedgerClick={() => setPhase("ledger")}
      />

      {tableIdPendingPayment && (
        <PaymentMethodDialog
          title="روش پرداخت"
          isBusy={isEndingTableSession}
          onSelect={endTableSessionWithPayment}
          onCancel={() => setTableIdPendingPayment(null)}
        />
      )}

      {selectedTable && selectedTable.status === "free" && (
        <StartTableSessionDialog
          tableId={selectedTable.id}
          tableName={selectedTable.name}
          onStarted={() => {
            setSelectedTableId(null);
            refreshHomeScreenData();
          }}
          onCancel={() => setSelectedTableId(null)}
        />
      )}

      {selectedTable && selectedTable.status === "in_use" && (
        <ManageTableSessionDialog
          tableName={selectedTable.name}
          onEnd={() => {
            setSelectedTableId(null);
            setTableIdPendingPayment(selectedTable.id);
          }}
          onCancel={() => setSelectedTableId(null)}
        />
      )}

      {selectedDevice && selectedDevice.status === "free" && (
        <StartPsSessionDialog
          deviceId={selectedDevice.id}
          deviceName={selectedDevice.name}
          onStarted={() => {
            setSelectedDeviceId(null);
            refreshHomeScreenData();
          }}
          onCancel={() => setSelectedDeviceId(null)}
        />
      )}

      {selectedDevice && selectedDevice.status === "in_use" && (
        <ManagePsSessionDialog
          deviceId={selectedDevice.id}
          deviceName={selectedDevice.name}
          onEnded={() => {
            setSelectedDeviceId(null);
            refreshHomeScreenData();
          }}
          onChanged={() => refreshHomeScreenData()}
          onCancel={() => setSelectedDeviceId(null)}
        />
      )}

      {isPasswordPromptOpen && (
        <PasswordPromptDialog
          onUnlocked={() => {
            setIsPasswordPromptOpen(false);
            setPhase("settings");
          }}
          onCancel={() => setIsPasswordPromptOpen(false)}
          onForgotPassword={() => {
            setIsPasswordPromptOpen(false);
            setIsForgotPasswordOpen(true);
          }}
        />
      )}

      {isForgotPasswordOpen && (
        <ForgotPasswordDialog
          onRecovered={() => {
            setIsForgotPasswordOpen(false);
            setPhase("settings");
          }}
          onCancel={() => setIsForgotPasswordOpen(false)}
        />
      )}
    </>
  );
}


