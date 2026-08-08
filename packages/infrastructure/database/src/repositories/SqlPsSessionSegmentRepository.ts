import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  PsSessionSegmentRecord,
  PsSessionSegmentRepository,
} from "../../../../core/src/domain/ports/PsSessionSegmentRepository";

interface PsSessionSegmentRow {
  id: string;
  ps_session_id: string;
  controller_count: number;
  segment_start: string;
  segment_end: string | null;
  billed_minutes: number | null;
  segment_amount: number | null;
}

function toRecord(row: PsSessionSegmentRow): PsSessionSegmentRecord {
  return {
    id: row.id,
    psSessionId: row.ps_session_id,
    controllerCount: row.controller_count,
    segmentStart: row.segment_start,
    segmentEnd: row.segment_end,
    billedMinutes: row.billed_minutes,
    segmentAmount: row.segment_amount,
  };
}

export class SqlPsSessionSegmentRepository implements PsSessionSegmentRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: PsSessionSegmentRecord): void {
    this.connection.execute(
      `INSERT INTO ps_session_segment
        (id, ps_session_id, controller_count, segment_start, segment_end, billed_minutes, segment_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.psSessionId,
        record.controllerCount,
        record.segmentStart,
        record.segmentEnd,
        record.billedMinutes,
        record.segmentAmount,
      ]
    );
  }

  findActiveByPsSessionId(psSessionId: string): PsSessionSegmentRecord | undefined {
    const row = this.connection.queryOne<PsSessionSegmentRow>(
      "SELECT * FROM ps_session_segment WHERE ps_session_id = ? AND segment_end IS NULL",
      [psSessionId]
    );
    return row ? toRecord(row) : undefined;
  }

  closeSegment(id: string, segmentEnd: string, billedMinutes: number, segmentAmount: number): void {
    this.connection.execute(
      `UPDATE ps_session_segment
       SET segment_end = ?, billed_minutes = ?, segment_amount = ?
       WHERE id = ?`,
      [segmentEnd, billedMinutes, segmentAmount, id]
    );
  }

  findAllByPsSessionId(psSessionId: string): PsSessionSegmentRecord[] {
    const rows = this.connection.queryAll<PsSessionSegmentRow>(
      "SELECT * FROM ps_session_segment WHERE ps_session_id = ? ORDER BY segment_start ASC",
      [psSessionId]
    );
    return rows.map(toRecord);
  }
}
