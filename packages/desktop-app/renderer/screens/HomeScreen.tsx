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
}

const TABLE_PLACEHOLDER = "./placeholders/billiard-table.svg";
const PS4_PLACEHOLDER = "./placeholders/ps4-device.svg";
const PS5_PLACEHOLDER = "./placeholders/ps5-device.svg";

export function HomeScreen({ tables, devices, onTableClick, onDeviceClick }: HomeScreenProps) {
  return (
    <div className="home-screen">
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
          {tables.length === 0 && (
            <p className="home-screen__empty">میزی تعریف نشده — از تنظیمات میز اضافه کنید</p>
          )}
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
          {devices.filter((device) => device.deviceType === "ps4").length === 0 && (
            <p className="home-screen__empty">دستگاه PS4 تعریف نشده — از تنظیمات اضافه کنید</p>
          )}
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
          {devices.filter((device) => device.deviceType === "ps5").length === 0 && (
            <p className="home-screen__empty">دستگاه PS5 تعریف نشده — از تنظیمات اضافه کنید</p>
          )}
        </div>
      </section>
    </div>
  );
}
