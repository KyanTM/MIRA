import { itemPath } from '../../records/record-config';
import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { DashboardItemType, DashboardRecentItem } from '../models';

const ITEM_TYPE_LABELS: Record<DashboardItemType, string> = {
  Asset: 'Bezitting',
  Document: 'Document',
  Warranty: 'Garantie',
  Contract: 'Contract',
  Subscription: 'Abonnement',
  Item: 'Item',
};

@Component({
  selector: 'app-recent-items',
  imports: [DatePipe, RouterLink, StatusBadge],
  templateUrl: './recent-items.html',
  styleUrl: './recent-items.css',
})
export class RecentItems {
  readonly itemPath = itemPath;
  readonly items = input.required<DashboardRecentItem[]>();

  typeLabel(itemType: DashboardItemType): string {
    return ITEM_TYPE_LABELS[itemType];
  }
}
