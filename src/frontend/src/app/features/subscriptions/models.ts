/**
 * Een union type beperkt een string tot de waarden die de backend aanvaardt.
 * Je krijgt hierdoor meteen een TypeScript-fout bij een tikfout.
 */
export type BillingFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'SemiAnnually' | 'Yearly';

export interface SubscriptionSummary {
  id: string;
  name: string;
  provider: string;
  price: number;
  billingFrequency: BillingFrequency;
  nextBillingDate: string | null;
  automaticallyRenews: boolean;
  isActive: boolean;
  status: string;
  createdAt: string;
}

export interface SubscriptionDetail {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  price: number;
  billingFrequency: BillingFrequency;
  startDate: string | null;
  endDate: string | null;
  nextBillingDate: string | null;
  trialEndsOn: string | null;
  automaticallyRenews: boolean;
  cancellationNoticeDays: number | null;
  paymentMethod: string | null;
  isActive: boolean;
  notes: string | null;
  contractId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface CreateSubscriptionRequest {
  name: string;
  description: string | null;
  provider: string;
  price: number;
  billingFrequency: BillingFrequency;
  startDate: string | null;
  endDate: string | null;
  nextBillingDate: string | null;
  trialEndsOn: string | null;
  automaticallyRenews: boolean;
  cancellationNoticeDays: number | null;
  paymentMethod: string | null;
  isActive: boolean;
  notes: string | null;
  contractId: string | null;
}

/** Create en update hebben in de huidige backend hetzelfde requestcontract. */
export type UpdateSubscriptionRequest = CreateSubscriptionRequest;
