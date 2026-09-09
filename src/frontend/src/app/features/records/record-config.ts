export type RecordKind = 'contracts' | 'warranties' | 'documents';
export type FieldValue = string | number | boolean | null;
export interface RecordLink {
  itemId: string;
  itemName: string;
  itemType: string;
  role: string;
}
export interface ArchiveRecord {
  id: string;
  name: string;
  status: string;
  links?: RecordLink[];
  [key: string]: FieldValue | RecordLink[] | undefined;
}
export interface Choice {
  id: string;
  name: string;
}
export interface RecordField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'number' | 'checkbox' | 'select';
  required?: boolean;
  max?: number;
  min?: number;
  integer?: boolean;
  options?: Choice[];
}
const frequencies = ['Weekly', 'Monthly', 'Quarterly', 'SemiAnnually', 'Yearly'].map((id, i) => ({
  id,
  name: ['Wekelijks', 'Maandelijks', 'Per kwartaal', 'Halfjaarlijks', 'Jaarlijks'][i],
}));
export const documentTypes = [
  'Other',
  'Invoice',
  'Receipt',
  'Contract',
  'WarrantyCertificate',
  'InsurancePolicy',
  'Certificate',
  'IdentityDocument',
  'Manual',
  'MaintenanceReport',
  'Letter',
  'TaxDocument',
  'BankDocument',
  'RegistrationProof',
  'Image',
].map((id, i) => ({
  id,
  name: [
    'Overig',
    'Factuur',
    'Kassabon',
    'Contract',
    'Garantiebewijs',
    'Verzekeringspolis',
    'Certificaat',
    'Identiteitsdocument',
    'Handleiding',
    'Onderhoudsverslag',
    'Brief',
    'Belastingdocument',
    'Bankdocument',
    'Registratiebewijs',
    'Afbeelding',
  ][i],
}));
const common: RecordField[] = [{ key: 'name', label: 'Naam', required: true, max: 200 }];
export const recordConfigs: Record<
  RecordKind,
  { title: string; singular: string; fields: RecordField[]; columns: string[] }
> = {
  contracts: {
    title: 'Contracten',
    singular: 'Contract',
    columns: ['contractParty', 'endsOn', 'cost'],
    fields: [
      ...common,
      { key: 'contractParty', label: 'Contractpartij', required: true, max: 200 },
      { key: 'contractNumber', label: 'Contractnummer', max: 100 },
      { key: 'startsOn', label: 'Begindatum', type: 'date', required: true },
      { key: 'endsOn', label: 'Einddatum', type: 'date' },
      {
        key: 'cancellationNoticeDays',
        label: 'Opzegtermijn (dagen)',
        type: 'number',
        min: 0,
        integer: true,
      },
      { key: 'cancellationDeadline', label: 'Uiterste opzegdatum', type: 'date' },
      { key: 'automaticallyRenews', label: 'Automatisch verlengen', type: 'checkbox' },
      {
        key: 'renewalPeriodMonths',
        label: 'Verlengingsperiode (maanden)',
        type: 'number',
        min: 1,
        integer: true,
      },
      { key: 'cost', label: 'Kosten (€)', type: 'number', min: 0 },
      { key: 'billingFrequency', label: 'Betaalfrequentie', type: 'select', options: frequencies },
      { key: 'description', label: 'Beschrijving', type: 'textarea', max: 2000 },
    ],
  },
  warranties: {
    title: 'Garanties',
    singular: 'Garantie',
    columns: ['provider', 'endsOn'],
    fields: [
      ...common,
      { key: 'assetId', label: 'Bezitting', type: 'select', required: true },
      { key: 'provider', label: 'Garantieverstrekker', required: true, max: 200 },
      { key: 'startsOn', label: 'Begindatum', type: 'date', required: true },
      { key: 'endsOn', label: 'Einddatum', type: 'date', required: true },
      { key: 'warrantyType', label: 'Garantietype', max: 100 },
      { key: 'terms', label: 'Voorwaarden', type: 'textarea', max: 4000 },
      { key: 'claimInstructions', label: 'Instructies bij een claim', type: 'textarea', max: 2000 },
      { key: 'description', label: 'Beschrijving', type: 'textarea', max: 2000 },
    ],
  },
  documents: {
    title: 'Documenten',
    singular: 'Document',
    columns: ['documentType', 'issuer', 'expiresOn'],
    fields: [
      ...common,
      {
        key: 'documentType',
        label: 'Documenttype',
        type: 'select',
        required: true,
        options: documentTypes,
      },
      { key: 'issuer', label: 'Uitgever', max: 200 },
      { key: 'issuedOn', label: 'Uitgiftedatum', type: 'date' },
      { key: 'expiresOn', label: 'Vervaldatum', type: 'date' },
      { key: 'description', label: 'Beschrijving', type: 'textarea', max: 2000 },
    ],
  },
};
export function itemPath(type: string): string {
  return (
    (
      {
        Asset: 'assets',
        Subscription: 'subscriptions',
        Contract: 'contracts',
        Warranty: 'warranties',
        Document: 'documents',
      } as Record<string, string>
    )[type] ?? 'dashboard'
  );
}
