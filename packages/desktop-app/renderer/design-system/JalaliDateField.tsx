import { toPersianDigits, toLatinDigits } from "../../../core/src/localization/PersianDigits";
import "./jalali-date-field.css";

interface JalaliDateFieldProps {
  year: number;
  month: number;
  day: number;
  onChange: (value: { year: number; month: number; day: number }) => void;
}

export function JalaliDateField({ year, month, day, onChange }: JalaliDateFieldProps) {
  function updateField(field: "year" | "month" | "day", rawValue: string) {
    const numericValue = Number(toLatinDigits(rawValue));
    if (Number.isNaN(numericValue)) {
      return;
    }
    onChange({ year, month, day, [field]: numericValue });
  }

  return (
    <div className="jalali-date-field">
      <input
        type="text"
        inputMode="numeric"
        className="jalali-date-field__day"
        value={toPersianDigits(day)}
        onChange={(event) => updateField("day", event.target.value)}
        maxLength={2}
      />
      <span className="jalali-date-field__separator">/</span>
      <input
        type="text"
        inputMode="numeric"
        className="jalali-date-field__month"
        value={toPersianDigits(month)}
        onChange={(event) => updateField("month", event.target.value)}
        maxLength={2}
      />
      <span className="jalali-date-field__separator">/</span>
      <input
        type="text"
        inputMode="numeric"
        className="jalali-date-field__year"
        value={toPersianDigits(year)}
        onChange={(event) => updateField("year", event.target.value)}
        maxLength={4}
      />
    </div>
  );
}
