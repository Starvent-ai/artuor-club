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
import { Sidebar, AppSection } from "./design-system/Sidebar";
import "./app-shell.css";

type AppPhase = "splash" | "staff_selection" | "main_application";

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
  const [activeSection, setActiveSection] = useState<AppSection>("home");
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

  async function selectSection(section: AppSection) {
    if (section === "settings") {
      const status = await window.arthurClub.getSecurityStatus();
      if (status.isPasswordSet) {
        setIsPasswordPromptOpen(true);
        return;
      }
    }
    setActiveSection(section);
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
    <div className="app-shell">
      <div className="app-shell__content">
        {activeSection === "home" && (
          <HomeScreen
            tables={tables}
            devices={devices}
            onTableClick={handleTableClick}
            onDeviceClick={(deviceId) => setSelectedDeviceId(deviceId)}
          />
        )}
        {activeSection === "open_tabs" && <OpenTabsScreen />}
        {activeSection === "ledger" && <LedgerScreen />}
        {activeSection === "reports" && <ReportsScreen />}
        {activeSection === "transactions" && <TransactionsScreen />}
        {activeSection === "settings" && <SettingsScreen />}
      </div>

      <Sidebar activeSection={activeSection} onSelect={selectSection} />

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
          tableId={selectedTable.id}
          tableName={selectedTable.name}
          onEndRequiresPayment={() => {
            setSelectedTableId(null);
            setTableIdPendingPayment(selectedTable.id);
          }}
          onEndedWithoutPayment={() => {
            setSelectedTableId(null);
            refreshHomeScreenData();
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
            setActiveSection("settings");
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
            setActiveSection("settings");
          }}
          onCancel={() => setIsForgotPasswordOpen(false)}
        />
      )}
    </div>
  );
}
