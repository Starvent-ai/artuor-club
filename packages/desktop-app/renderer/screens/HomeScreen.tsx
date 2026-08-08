import { UnitStatusCard } from "./UnitStatusCard";
import "./home-screen.css";

export interface HomeScreenTable {
  id: string;
  name: string;
  status: "free" | "in_use";
}

export interface HomeScreenDevice {
  id: string;
  name: string;
  deviceType: "ps4" | "ps5";
  status: "free" | "in_use";
}

interface HomeScreenProps {
  tables: HomeScreenTable[];
  devices: HomeScreenDevice[];
  onTableClick: (tableId: string) => void;
  onDeviceClick: (deviceId: string) => void;
  onOpenTabsClick: () => void;
  onSettingsClick: () => void;
  onReportsClick: () => void;
  onTransactionsClick: () => void;
}

const TABLE_PLACEHOLDER = "../assets/placeholders/billiard-table.svg";
const PS4_PLACEHOLDER = "../assets/placeholders/ps4-device.svg";
const PS5_PLACEHOLDER = "../assets/placeholders/ps5-device.svg";

export function HomeScreen({
  tables,
  devices,
  onTableClick,
  onDeviceClick,
  onOpenTabsClick,
  onSettingsClick,
  onReportsClick,
  onTransactionsClick,
}: HomeScreenProps) {
  return (
    <div className="home-screen">
      <div className="home-screen__top-bar">
        <button
          type="button"
          className="home-screen__settings-button"
          onClick={onTransactionsClick}
        >
          تراکنش‌ها
        </button>
        <button type="button" className="home-screen__settings-button" onClick={onReportsClick}>
          گزارش‌ها
        </button>
        <button type="button" className="home-screen__settings-button" onClick={onSettingsClick}>
          تنظیمات
        </button>
        <button type="button" className="home-screen__open-tabs-button" onClick={onOpenTabsClick}>
          حساب‌های باز
        </button>
      </div>

      <section className="home-screen__section">
        <h2 className="home-screen__section-title">میزهای بیلیارد</h2>
        <div className="home-screen__grid">
          {tables.map((table) => (
            <UnitStatusCard
              key={table.id}
              name={table.name}
              status={table.status}
              imageUrl={TABLE_PLACEHOLDER}
              onClick={() => onTableClick(table.id)}
            />
          ))}
        </div>
      </section>

      <section className="home-screen__section">
        <h2 className="home-screen__section-title">PS4</h2>
        <div className="home-screen__grid">
          {devices
            .filter((device) => device.deviceType === "ps4")
            .map((device) => (
              <UnitStatusCard
                key={device.id}
                name={device.name}
                status={device.status}
                imageUrl={PS4_PLACEHOLDER}
                onClick={() => onDeviceClick(device.id)}
              />
            ))}
        </div>
      </section>

      <section className="home-screen__section">
        <h2 className="home-screen__section-title">PS5</h2>
        <div className="home-screen__grid">
          {devices
            .filter((device) => device.deviceType === "ps5")
            .map((device) => (
              <UnitStatusCard
                key={device.id}
                name={device.name}
                status={device.status}
                imageUrl={PS5_PLACEHOLDER}
                onClick={() => onDeviceClick(device.id)}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
