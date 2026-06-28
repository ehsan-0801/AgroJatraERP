// Pure money/stock helpers — kept dependency-free so they're easy to unit-test
// and shared between the sales, purchases and payments routes.

export interface LineItem { quantity: number; unit_price: number }

/** Subtotal of line items, and the grand total after tax and discount. */
export function computeTotals(items: LineItem[], tax = 0, discount = 0): { subtotal: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  return { subtotal, total: subtotal + tax - discount };
}

/** Outstanding amount on an invoice — never negative. */
export function dueOf(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

/** New paid amount after applying a payment — capped at the invoice total. */
export function applyPayment(currentPaid: number, total: number, amount: number): number {
  return Math.min(total, currentPaid + amount);
}
