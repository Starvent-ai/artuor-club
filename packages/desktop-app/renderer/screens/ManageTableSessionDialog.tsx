import "./create-open-tab-dialog.css";

interface ManageTableSessionDialogProps {
  tableName: string;
  onEnd: () => void;
  onCancel: () => void;
}

export function ManageTableSessionDialog({ tableName, onEnd, onCancel }: ManageTableSessionDialogProps) {
  return (
    <div className="create-open-tab-dialog__overlay">
      <div className="create-open-tab-dialog">
        <div className="create-open-tab-dialog__title">{tableName}</div>
        <div className="create-open-tab-dialog__subtitle">این میز در حال بازی است</div>
        <div className="create-open-tab-dialog__actions">
          <button type="button" onClick={onCancel}>
            بستن
          </button>
          <button type="button" className="create-open-tab-dialog__danger" onClick={onEnd}>
            پایان بازی
          </button>
        </div>
      </div>
    </div>
  );
}
