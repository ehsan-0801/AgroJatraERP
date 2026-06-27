import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, currency = 'BDT') {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Strips redundant leading zeros from a numeric input string:
 *  "05" → "5", "007" → "7", keeps "0", "0.5", "00.5" → "0.5", "" → "". */
export function stripLeadingZeros(v: string): string {
  return v.replace(/^0+(?=\d)/, '');
}

/** Displays a number in an input, showing an empty field for 0 (so there's no
 *  stuck leading zero the user has to delete before typing). */
export function numInput(n: number): string {
  return n === 0 ? '' : String(n);
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
