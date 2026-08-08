export class Money {
  private readonly amountInToman: number;

  private constructor(amountInToman: number) {
    if (!Number.isFinite(amountInToman) || amountInToman < 0) {
      throw new Error("INVALID_MONEY_AMOUNT");
    }
    this.amountInToman = Math.round(amountInToman);
  }

  static fromToman(amount: number): Money {
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  toToman(): number {
    return this.amountInToman;
  }

  add(other: Money): Money {
    return new Money(this.amountInToman + other.amountInToman);
  }

  subtract(other: Money): Money {
    return new Money(this.amountInToman - other.amountInToman);
  }

  isLessThan(other: Money): boolean {
    return this.amountInToman < other.amountInToman;
  }

  isZero(): boolean {
    return this.amountInToman === 0;
  }

  equals(other: Money): boolean {
    return this.amountInToman === other.amountInToman;
  }
}
