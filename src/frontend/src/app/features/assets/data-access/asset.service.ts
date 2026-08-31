import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AssetDetail, AssetSummary, CreateAssetRequest, UpdateAssetRequest } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly assetsUrl = `${environment.apiUrl}/assets`;

  getAssets(includeArchived = false): Observable<AssetSummary[]> {
    if (!includeArchived) {
      return this.http.get<AssetSummary[]>(this.assetsUrl);
    }

    const params = new HttpParams().set('includeArchived', true);

    return this.http.get<AssetSummary[]>(this.assetsUrl, { params });
  }

  getAsset(id: string): Observable<AssetDetail> {
    return this.http.get<AssetDetail>(`${this.assetsUrl}/${id}`);
  }

  createAsset(request: CreateAssetRequest): Observable<AssetDetail> {
    return this.http.post<AssetDetail>(this.assetsUrl, request);
  }

  updateAsset(id: string, request: UpdateAssetRequest): Observable<AssetDetail> {
    return this.http.put<AssetDetail>(`${this.assetsUrl}/${id}`, request);
  }

  archiveAsset(id: string): Observable<AssetDetail> {
    return this.http.patch<AssetDetail>(`${this.assetsUrl}/${id}/archive`, null);
  }

  restoreAsset(id: string): Observable<AssetDetail> {
    return this.http.patch<AssetDetail>(`${this.assetsUrl}/${id}/restore`, null);
  }
}
