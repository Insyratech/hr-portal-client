import type { FinanceCustomer } from '@/types/api';

export function composeAddressLines(parts: {
  line1?: string;
  line2?: string;
  city?: string;
  stateName?: string | null;
  postalCode?: string;
  country?: string;
}): string {
  const locality = [parts.city, parts.stateName, parts.postalCode]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(', ');
  return [parts.line1, parts.line2, locality, parts.country]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join('\n');
}

export function formatCustomerBillingAddress(customer: FinanceCustomer): string {
  const structured = composeAddressLines({
    line1: customer.billingLine1,
    line2: customer.billingLine2,
    city: customer.billingCity,
    stateName: customer.stateName,
    postalCode: customer.billingPostalCode,
    country: customer.billingCountry || 'India',
  });
  return structured || customer.billingAddress;
}

export function formatCustomerShippingAddress(customer: FinanceCustomer): string {
  const structured = composeAddressLines({
    line1: customer.shippingLine1,
    line2: customer.shippingLine2,
    city: customer.shippingCity,
    stateName: customer.shippingStateName ?? customer.stateName,
    postalCode: customer.shippingPostalCode,
    country: customer.shippingCountry || 'India',
  });
  return structured || customer.shippingAddress;
}

export function customerShipToName(customer: FinanceCustomer): string {
  const parts = [customer.shipToContactName, customer.shipToCompanyName].map((part) => part.trim()).filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return customer.companyName || customer.displayName;
}

export function addDaysIso(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T12:00:00+05:30`);
  base.setUTCDate(base.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(base);
}

export function formatIstDisplay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}
