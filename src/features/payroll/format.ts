export function formatInr(value: number): string {
  const amount = value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₹${amount}`;
}
