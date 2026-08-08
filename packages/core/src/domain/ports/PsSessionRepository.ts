export interface PsSessionRecord {
  id: string;
  deviceId: string;
  openTabId: string | null;
  staffId: string;
  startTime: string;
  endTime: string | null;
  finalAmount: number | null;
  status: "active" | "closed";
}

export interface PsSessionRepository {
  create(record: PsSessionRecord): void;
  findActiveByDeviceId(deviceId: string): PsSessionRecord | undefined;
  findById(id: string): PsSessionRecord | undefined;
  closeSession(id: string, endTime: string, finalAmount: number): void;
}
