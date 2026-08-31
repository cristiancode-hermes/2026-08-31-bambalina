import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API, type Addon, type Piece, type Rack, type Rental } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  racks() {
    return this.http.get<Rack[]>(`${API}/racks`);
  }
  rack(id: string) {
    return this.http.get<Rack>(`${API}/racks/${id}`);
  }
  pieces(q?: { startOn?: string; endOn?: string; rackId?: string }) {
    let params = new HttpParams();
    if (q?.startOn) params = params.set('startOn', q.startOn);
    if (q?.endOn) params = params.set('endOn', q.endOn);
    if (q?.rackId) params = params.set('rackId', q.rackId);
    return this.http.get<Piece[]>(`${API}/pieces`, { params });
  }
  piece(id: string, q?: { startOn?: string; endOn?: string }) {
    let params = new HttpParams();
    if (q?.startOn) params = params.set('startOn', q.startOn);
    if (q?.endOn) params = params.set('endOn', q.endOn);
    return this.http.get<Piece>(`${API}/pieces/${id}`, { params });
  }
  addons() {
    return this.http.get<Addon[]>(`${API}/addons`);
  }
  checkout(body: { startOn: string; endOn: string; pieceIds: string[]; addonIds: string[] }) {
    return this.http.post<Rental>(`${API}/rentals/checkout`, body);
  }
  mine() {
    return this.http.get<Rental[]>(`${API}/rentals`);
  }
  mineOne(code: string) {
    return this.http.get<Rental>(`${API}/rentals/${code}`);
  }
  publicRental(code: string) {
    return this.http.get<Rental>(`${API}/rentals/public/${code}`);
  }
  cancel(id: string) {
    return this.http.post<Rental>(`${API}/rentals/${id}/cancel`, {});
  }
  pickup(codeOrUrl: string) {
    return this.http.post<{ rental: Rental; status: string }>(`${API}/staff/pickup`, { codeOrUrl });
  }
  returnScan(codeOrUrl: string) {
    return this.http.post<{ rental: Rental; status: string; lateFeeCents: number }>(`${API}/staff/return`, { codeOrUrl });
  }
  occupancy() {
    return this.http.get<Array<{ date: string; busy: number; total: number; pct: number }>>(`${API}/stats/occupancy`);
  }
  myStats() {
    return this.http.get<{ points: number; returnedDays: number }>(`${API}/stats/me`);
  }
  reviews(pieceId: string) {
    return this.http.get<Array<{ id: string; rating: number; body: string | null }>>(`${API}/reviews/piece/${pieceId}`);
  }
  review(body: { pieceId: string; rating: number; body?: string }) {
    return this.http.post(`${API}/reviews`, body);
  }
}
