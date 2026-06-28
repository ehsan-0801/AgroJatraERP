import { describe, expect, it } from 'vitest';
import { applyPayment, computeTotals, dueOf } from '../src/lib/calc';

describe('computeTotals', () => {
  it('sums line items', () => {
    expect(computeTotals([{ quantity: 2, unit_price: 100 }, { quantity: 1, unit_price: 50 }])).toEqual({ subtotal: 250, total: 250 });
  });
  it('applies tax and discount', () => {
    expect(computeTotals([{ quantity: 1, unit_price: 1000 }], 100, 50)).toEqual({ subtotal: 1000, total: 1050 });
  });
  it('handles no items', () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, total: 0 });
  });
});

describe('dueOf', () => {
  it('returns remaining due', () => { expect(dueOf(1000, 400)).toBe(600); });
  it('never goes negative when overpaid', () => { expect(dueOf(1000, 1200)).toBe(0); });
  it('is zero when fully paid', () => { expect(dueOf(500, 500)).toBe(0); });
});

describe('applyPayment', () => {
  it('adds the payment to the current paid amount', () => { expect(applyPayment(200, 1000, 300)).toBe(500); });
  it('caps at the invoice total', () => { expect(applyPayment(800, 1000, 500)).toBe(1000); });
});
