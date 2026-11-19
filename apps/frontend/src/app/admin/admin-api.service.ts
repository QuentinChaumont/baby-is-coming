import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@org/frontend-core';
import { SKIP_ERROR_TOAST } from '@org/frontend-feedback';
import type {
  AdminBirthList,
  AdminContribution,
  AdminItem,
  AdminListing,
  AdminParticipation,
  AssignItemRequest,
  CreateItemRequest,
  CreateListingRequest,
  ItemPublication,
  UpdateBirthListRequest,
  UpdateContributionRequest,
  UpdateItemRequest,
  UpdateListingRequest,
  UpdateParticipationRequest,
} from '@org/shared-contracts';
import { Observable } from 'rxjs';

/** Back-office errors are shown inline, in French. */
const INLINE_ERRORS = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

/** Parents' API (`/api/admin/*`, admin role). */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/admin`;

  // ── list settings ──
  list(): Observable<AdminBirthList> {
    return this.http.get<AdminBirthList>(`${this.base}/list`, INLINE_ERRORS);
  }
  updateList(patch: UpdateBirthListRequest): Observable<AdminBirthList> {
    return this.http.patch<AdminBirthList>(`${this.base}/list`, patch, INLINE_ERRORS);
  }

  // ── items ──
  items(publication?: ItemPublication): Observable<AdminItem[]> {
    const params: Record<string, string> = publication ? { publication } : {};
    return this.http.get<AdminItem[]>(`${this.base}/items`, { ...INLINE_ERRORS, params });
  }
  item(id: string): Observable<AdminItem> {
    return this.http.get<AdminItem>(`${this.base}/items/${id}`, INLINE_ERRORS);
  }
  createItem(body: CreateItemRequest): Observable<AdminItem> {
    return this.http.post<AdminItem>(`${this.base}/items`, body, INLINE_ERRORS);
  }
  updateItem(id: string, patch: UpdateItemRequest): Observable<AdminItem> {
    return this.http.patch<AdminItem>(`${this.base}/items/${id}`, patch, INLINE_ERRORS);
  }
  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/items/${id}`, INLINE_ERRORS);
  }
  reorderItems(ids: string[]): Observable<AdminItem[]> {
    return this.http.post<AdminItem[]>(`${this.base}/items/reorder`, { ids }, INLINE_ERRORS);
  }
  uploadPhoto(itemId: string, file: Blob): Observable<AdminItem> {
    const form = new FormData();
    form.append('file', file, 'photo.jpg');
    return this.http.post<AdminItem>(`${this.base}/items/${itemId}/photos`, form, INLINE_ERRORS);
  }
  deletePhoto(itemId: string, photoId: string): Observable<AdminItem> {
    return this.http.delete<AdminItem>(`${this.base}/items/${itemId}/photos/${photoId}`, INLINE_ERRORS);
  }

  // ── listings ──
  listings(itemId: string): Observable<AdminListing[]> {
    return this.http.get<AdminListing[]>(`${this.base}/items/${itemId}/listings`, INLINE_ERRORS);
  }
  createListing(itemId: string, body: CreateListingRequest): Observable<AdminListing> {
    return this.http.post<AdminListing>(`${this.base}/items/${itemId}/listings`, body, INLINE_ERRORS);
  }
  updateListing(id: string, patch: UpdateListingRequest): Observable<AdminListing> {
    return this.http.patch<AdminListing>(`${this.base}/listings/${id}`, patch, INLINE_ERRORS);
  }
  deleteListing(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/listings/${id}`, INLINE_ERRORS);
  }

  // ── participations ──
  participations(): Observable<AdminParticipation[]> {
    return this.http.get<AdminParticipation[]>(`${this.base}/participations`, INLINE_ERRORS);
  }
  assign(itemId: string, body: AssignItemRequest): Observable<AdminParticipation> {
    return this.http.post<AdminParticipation>(`${this.base}/items/${itemId}/participations`, body, INLINE_ERRORS);
  }
  updateParticipation(id: string, patch: UpdateParticipationRequest): Observable<AdminParticipation> {
    return this.http.patch<AdminParticipation>(`${this.base}/participations/${id}`, patch, INLINE_ERRORS);
  }
  cancelParticipation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/participations/${id}`, INLINE_ERRORS);
  }

  // ── kitty ──
  contributions(): Observable<AdminContribution[]> {
    return this.http.get<AdminContribution[]>(`${this.base}/contributions`, INLINE_ERRORS);
  }
  updateContribution(id: string, patch: UpdateContributionRequest): Observable<AdminContribution> {
    return this.http.patch<AdminContribution>(`${this.base}/contributions/${id}`, patch, INLINE_ERRORS);
  }
  cancelContribution(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/contributions/${id}`, INLINE_ERRORS);
  }
}
