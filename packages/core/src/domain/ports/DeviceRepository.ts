export interface DeviceRecord {
  id: string;
  name: string;
  deviceType: "ps4" | "ps5";
  maxControllers: number;
  status: "free" | "in_use";
  isActive: boolean;
}

export interface DeviceRepository {
  findAllActive(): DeviceRecord[];
  findById(id: string): DeviceRecord | undefined;
  updateStatus(id: string, status: DeviceRecord["status"]): void;
  create(input: { id: string; name: string; deviceType: "ps4" | "ps5"; maxControllers: number }): void;
  deactivate(id: string): void;
}
