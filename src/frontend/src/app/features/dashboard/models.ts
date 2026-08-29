export type DashboardItemType =
  'Asset' | 'Document' | 'Warranty' | 'Contract' | 'Subscription' | 'Item';

export type DashboardAttentionItemType = Exclude<DashboardItemType, 'Asset' | 'Item'>;

export type DashboardEventType =
  | 'WarrantyExpires'
  | 'DocumentExpires'
  | 'ContractCancellationDeadline'
  | 'ContractEnds'
  | 'SubscriptionBilling';

export type DashboardItemStatus =
  'Draft' | 'Active' | 'Inactive' | 'Expired' | 'Completed' | 'Cancelled' | 'Archived';

export interface DashboardCounts {
  assets: number;
  documents: number;
  warranties: number;
  contracts: number;
  subscriptions: number;
}

export interface DashboardRecentItem {
  id: string;
  name: string;
  itemType: DashboardItemType;
  status: DashboardItemStatus;
  createdAt: string;
}

export interface DashboardAttentionItem {
  itemId: string;
  itemName: string;
  itemType: DashboardAttentionItemType;
  eventType: DashboardEventType;
  dueOn: string;
}

export interface DashboardResponse {
  generatedAt: string;
  attentionThrough: string;
  counts: DashboardCounts;
  recentItems: DashboardRecentItem[];
  attentionItems: DashboardAttentionItem[];
}
