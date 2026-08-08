import { PremiumCard } from "../design-system/PremiumCard";
import "./unit-status-card.css";

interface UnitStatusCardProps {
  name: string;
  status: "free" | "in_use";
  imageUrl: string;
  onClick: () => void;
}

export function UnitStatusCard({ name, status, imageUrl, onClick }: UnitStatusCardProps) {
  return (
    <PremiumCard onClick={onClick}>
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
      </div>
    </PremiumCard>
  );
}
