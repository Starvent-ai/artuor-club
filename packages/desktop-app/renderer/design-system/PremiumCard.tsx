import type { ReactNode } from "react";
import "./premium-card.css";

interface PremiumCardProps {
  children: ReactNode;
  onClick?: () => void;
  elevated?: boolean;
}

export function PremiumCard({ children, onClick, elevated }: PremiumCardProps) {
  const className = elevated ? "premium-card premium-card--elevated" : "premium-card";

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={className}>{children}</div>;
}
