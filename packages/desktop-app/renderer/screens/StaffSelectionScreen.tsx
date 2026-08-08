import { PremiumCard } from "../design-system/PremiumCard";
import "./staff-selection-screen.css";

interface StaffOption {
  id: string;
  fullName: string;
}

interface StaffSelectionScreenProps {
  staffOptions: StaffOption[];
  onSelect: (staffId: string) => void;
}

export function StaffSelectionScreen({ staffOptions, onSelect }: StaffSelectionScreenProps) {
  return (
    <div className="staff-selection-screen">
      <h1 className="staff-selection-screen__title">انتخاب پرسنل</h1>
      <div className="staff-selection-screen__grid">
        {staffOptions.map((staff) => (
          <PremiumCard key={staff.id} onClick={() => onSelect(staff.id)}>
            <span className="staff-selection-screen__name">{staff.fullName}</span>
          </PremiumCard>
        ))}
      </div>
    </div>
  );
}
