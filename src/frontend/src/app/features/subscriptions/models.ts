/**
 * Een union type beperkt een string tot de waarden die de backend aanvaardt.
 * Je krijgt hierdoor meteen een TypeScript-fout bij een tikfout.
 */
export type BillingFrequency =
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'SemiAnnually'
  | 'Yearly';

export interface SubscriptionSummary {
  id: string;
  name: string;

  // ===== JOUW CODE — leerstap 1A =====
  // Voeg de overige velden van SubscriptionSummaryDto toe.
  // Denk na over string, number, boolean en "string | null".
  // Velden: provider, price, billingFrequency, nextBillingDate,
  // automaticallyRenews, isActive, status en createdAt.
  // ===== EINDE JOUW CODE =====
}

export interface SubscriptionDetail {
  id: string;
  name: string;
  description: string | null;

  // ===== JOUW CODE — leerstap 1B =====
  // Vul alle ontbrekende velden van SubscriptionDetailDto aan.
  // Gebruik BillingFrequency als type voor billingFrequency.
  // De volledige veldlijst staat in het Word-document.
  // ===== EINDE JOUW CODE =====
}

export interface CreateSubscriptionRequest {
  name: string;
  description: string | null;
  provider: string;

  // ===== JOUW CODE — leerstap 1C =====
  // Voeg alleen invoervelden toe die de gebruiker naar de API mag sturen.
  // id, status en timestamps horen hier dus niet thuis.
  // ===== EINDE JOUW CODE =====
}

/** Create en update hebben in de huidige backend hetzelfde requestcontract. */
export type UpdateSubscriptionRequest = CreateSubscriptionRequest;
