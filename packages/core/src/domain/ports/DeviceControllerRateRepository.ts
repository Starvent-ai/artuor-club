export interface DeviceControllerRateRecord {
  id: string;
  deviceType: "ps4" | "ps5";
  controllerCount: number;
  hourlyRate: number;
}

export interface DeviceControllerRateRepository {
  findRate(deviceType: "ps4" | "ps5", controllerCount: number): DeviceControllerRateRecord | undefined;
}
