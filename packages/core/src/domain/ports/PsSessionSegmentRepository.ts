export interface PsSessionSegmentRecord {
  id: string;
  psSessionId: string;
  controllerCount: number;
  segmentStart: string;
  segmentEnd: string | null;
  billedMinutes: number | null;
  segmentAmount: number | null;
}

export interface PsSessionSegmentRepository {
  create(record: PsSessionSegmentRecord): void;
  findActiveByPsSessionId(psSessionId: string): PsSessionSegmentRecord | undefined;
  closeSegment(id: string, segmentEnd: string, billedMinutes: number, segmentAmount: number): void;
  findAllByPsSessionId(psSessionId: string): PsSessionSegmentRecord[];
}
