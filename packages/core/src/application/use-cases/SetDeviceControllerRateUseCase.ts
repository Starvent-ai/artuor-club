import { randomUUID } from "node:crypto";
import type { DeviceControllerRateRepository } from "../../domain/ports/DeviceControllerRateRepository";

export interface SetDeviceControllerRateInput {
  deviceType: "ps4" | "ps5";
  controllerCount: number;
  hourlyRate: number;
}

export class SetDeviceControllerRateUseCase {
  constructor(private readonly deviceControllerRateRepository: DeviceControllerRateRepository) {}

  execute(input: SetDeviceControllerRateInput): void {
    this.deviceControllerRateRepository.upsert({
      id: randomUUID(),
      deviceType: input.deviceType,
      controllerCount: input.controllerCount,
      hourlyRate: input.hourlyRate,
    });
  }
}
