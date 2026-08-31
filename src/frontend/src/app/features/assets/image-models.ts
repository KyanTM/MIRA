export interface DocumentSummary {
  id: string;
  name: string;
  originalFileName: string;
  documentType: string;
  mimeType: string;
  fileSizeBytes: number;
  issuedOn: string | null;
  expiresOn: string | null;
  issuer: string | null;
  status: string;
  createdAt: string;
}

export interface DocumentDetail {
  id: string;
  name: string;
  description: string | null;
  originalFileName: string;
  documentType: string;
  mimeType: string;
  fileSizeBytes: number;
  checksum: string;
  issuedOn: string | null;
  expiresOn: string | null;
  issuer: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
  links: DocumentLink[];
}

export interface DocumentLink {
  itemId: string;
  itemName: string;
  itemType: string;
  role: string;
  linkedAt: string;
}

export type AssetImageRole = 'PrimaryImage' | 'GalleryImage';

export interface AssetImage {
  id: string;
  name: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: string;
  role: AssetImageRole;
}
