import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@org/frontend-core';
import { SKIP_ERROR_TOAST } from '@org/frontend-feedback';
import {
  isApiError,
  type PledgeRequest,
  type PublicBirthList,
  type PublicItem,
  type PublicItemDetail,
  type PublicItemsQuery,
  type PublicKitty,
  type TakeItemRequest,
} from '@org/shared-contracts';
import { Observable } from 'rxjs';

/** Every public call handles its errors inline, in French — never the
 * generic (English) toast. */
const INLINE_ERRORS = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

/** Guest-facing API (no account): the list, its items, taking a gift,
 * the kitty. */
@Injectable({ providedIn: 'root' })
export class PublicApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/public`;

  list(): Observable<PublicBirthList> {
    return this.http.get<PublicBirthList>(`${this.base}/list`, INLINE_ERRORS);
  }

  items(query: PublicItemsQuery = {}): Observable<PublicItem[]> {
    let params = new HttpParams();
    if (query.q?.trim()) params = params.set('q', query.q.trim());
    if (query.showTaken) params = params.set('showTaken', 'true');
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<PublicItem[]>(`${this.base}/items`, { ...INLINE_ERRORS, params });
  }

  item(id: string): Observable<PublicItemDetail> {
    return this.http.get<PublicItemDetail>(`${this.base}/items/${encodeURIComponent(id)}`, INLINE_ERRORS);
  }

  take(id: string, request: TakeItemRequest): Observable<PublicItem> {
    return this.http.post<PublicItem>(
      `${this.base}/items/${encodeURIComponent(id)}/take`,
      request,
      INLINE_ERRORS,
    );
  }

  kitty(): Observable<PublicKitty> {
    return this.http.get<PublicKitty>(`${this.base}/kitty`, INLINE_ERRORS);
  }

  pledge(request: PledgeRequest): Observable<PublicKitty> {
    return this.http.post<PublicKitty>(`${this.base}/contributions`, request, INLINE_ERRORS);
  }
}

/** The API error code of a failed call, if any (`ITEM_ALREADY_TAKEN`…). */
export function apiErrorCode(error: unknown): string | null {
  if (error instanceof HttpErrorResponse && isApiError(error.error)) {
    return error.error.code;
  }
  return null;
}

/** « 15 mars 2027 » from `2027-03-15`. */
export function formatDay(isoDay: string): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
