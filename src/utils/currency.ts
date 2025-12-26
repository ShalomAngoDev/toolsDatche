import { Currency } from '../models/types';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'EUR') {
    return `${amount.toFixed(2)} €`;
  } else {
    return `${Math.round(amount)} F CFA`;
  }
}

export function parseCurrency(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

