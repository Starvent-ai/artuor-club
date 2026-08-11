import { useEffect, useState } from "react";
import { PremiumCard } from "../design-system/PremiumCard";
import { toPersianDigits } from "../../../core/src/localization/PersianDigits";
import "./unit-status-card.css";

interface UnitStatusCardProps {
  name: string;
  status: "free" | "in_use";
  imageUrl: string;
  activeSessionStartTime: string | null;
  onActionClick: () => void;
}

function useElapsedLabel(startTime: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startTime) {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) {
    return null;
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, "0");
    return toPersianDigits(`${paddedHours}:${paddedMinutes}:${paddedSeconds}`);
  }

  return toPersianDigits(`${paddedMinutes}:${paddedSeconds}`);
}

export function UnitStatusCard({
  name,
  status,
  imageUrl,
  activeSessionStartTime,
  onActionClick,
}: UnitStatusCardProps) {
  const elapsedLabel = useElapsedLabel(activeSessionStartTime);

  return (
    <div className="unit-status-card-wrapper">
      <PremiumCard>
        <div className="unit-status-card">
          <img className="unit-status-card__image" src={imageUrl} alt={name} />
          <div className="unit-status-card__info">
            <span className="unit-status-card__name">{name}</span>
            <span
              className={
                status === "free"
                  ? "unit-status-card__badge unit-status-card__badge--free"
                  : "unit-status-card__badge unit-status-card__badge--in-use"
              }
            >
              {status === "free" ? "آزاد" : "در حال بازی"}
            </span>
          </div>
          {elapsedLabel && <div className="unit-status-card__timer">{elapsedLabel}</div>}
        </div>
      </PremiumCard>
      <button
        type="button"
        className={
          status === "free"
            ? "unit-status-card__action unit-status-card__action--start"
            : "unit-status-card__action unit-status-card__action--end"
        }
        onClick={onActionClick}
      >
        {status === "free" ? "شروع بازی" : "پایان بازی"}
      </button>
    </div>
  );
}
