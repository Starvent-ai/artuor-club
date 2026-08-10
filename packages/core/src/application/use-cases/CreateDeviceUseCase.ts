import { randomUUID } from "node:crypto";
import type { DeviceRepository } from "../../domain/ports/DeviceRepository";

export interface CreateDeviceInput {
  name: string;
  deviceType: "ps4" | "ps5";
  maxControllers?: number;
}

export class CreateDeviceUseCase {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  execute(input: CreateDeviceInput): string {
    const deviceId = randomUUID();
    this.deviceRepository.create({
      id: deviceId,
      name: input.name,
      deviceType: input.deviceType,
      maxControllers: input.maxControllers ?? 4,
    });
    return deviceId;
  }
}
