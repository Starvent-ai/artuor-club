export class TimeRoundingService {
  static roundMinutes(rawMinutes: number): number {
    if (rawMinutes < 0) {
      throw new Error("INVALID_DURATION");
    }

    const wholeMinutes = Math.floor(rawMinutes);
    const remainder = wholeMinutes % 5;
    const baseFloor = wholeMinutes - remainder;

    if (remainder <= 1) {
      return baseFloor;
    }

    return baseFloor + 5;
  }

  static secondsToRawMinutes(seconds: number): number {
    return seconds / 60;
  }

  static computeBilledMinutesFromSeconds(seconds: number): number {
    const rawMinutes = TimeRoundingService.secondsToRawMinutes(seconds);
    return TimeRoundingService.roundMinutes(rawMinutes);
  }
}
