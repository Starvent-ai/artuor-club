import { toPersianDigits } from "./PersianDigits";

export function formatTomanWithSeparators(amountInToman: number): string {
  const isNegative = amountInToman < 0;
  const absoluteValue = Math.abs(Math.round(amountInToman));
  const withSeparators = absoluteValue.toLocaleString("en-US");
  const withPersianDigits = toPersianDigits(withSeparators);
  return isNegative ? `-${withPersianDigits} تومان` : `${withPersianDigits} تومان`;
}
