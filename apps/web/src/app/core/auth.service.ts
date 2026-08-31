import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, finalize } from 'rxjs';
import type { AuthResponse, User } from '../shared/models';
import { TOKEN_KEY, API } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<User | null>(null);
  private readonly loadingSignal = signal(false);

  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.getToken());
  readonly isStaff = computed(() => {
    const r = this.userSignal()?.role;
    return r === 'staff' || r === 'admin';
  });

  constructor() {
    queueMicrotask(() => this.bootstrap());
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setToken(token: string | null): void {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  setUser(user: User | null): void {
    this.userSignal.set(user);
  }

  bootstrap(): void {
    const token = this.getToken();
    if (!token) {
      this.userSignal.set(null);
      return;
    }
    this.loadingSignal.set(true);
    this.me()
      .pipe(
        catchError(() => {
          this.setToken(null);
          this.userSignal.set(null);
          return of(null);
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe((u) => {
        if (u) this.userSignal.set(u);
      });
  }

  login(payload: { identifier: string; password: string }): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.http.post<AuthResponse>(`${API}/auth/login`, payload).pipe(
      tap((res) => {
        this.setToken(res.token || res.accessToken || null);
        this.userSignal.set(res.user);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  register(payload: { username: string; email: string; password: string }): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.http.post<AuthResponse>(`${API}/auth/register`, payload).pipe(
      tap((res) => {
        this.setToken(res.token || res.accessToken || null);
        this.userSignal.set(res.user);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${API}/auth/me`);
  }

  logout(): void {
    this.setToken(null);
    this.userSignal.set(null);
    void this.router.navigateByUrl('/login');
  }
}
