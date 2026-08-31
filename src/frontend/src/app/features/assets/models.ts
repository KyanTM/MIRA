export interface AssetSummary {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  status: string;
  createdAt: string;
}

export interface AssetDetail {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  seller: string | null;
  location: string | null;
  currentValue: number | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface CreateAssetRequest {
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  seller: string | null;
  location: string | null;
  currentValue: number | null;
}

export interface UpdateAssetRequest {
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  seller: string | null;
  location: string | null;
  currentValue: number | null;
}
