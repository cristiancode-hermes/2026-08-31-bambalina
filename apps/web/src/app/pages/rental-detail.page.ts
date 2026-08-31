import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { humanizeApiError, money, type Rental } from '../shared/models';

@Component({
  selector: 'app-rental-detail',
  imports: [RouterLink],
  template: `
    @if (loading()) { <p class="muted" style="padding:32px 0">Cargando…</p> }
    @else if (error()) {
      <section class="screen">
        <h2>Alquiler no encontrado</h2>
        <p>{{ error() }}</p>
        <a class="btn btn-primary" routerLink="/mis-alquileres">Volver</a>
      </section>
    } @else if (rental(); as r) {
      <section class="hero">
        <p class="mono">{{ r.code }}</p>
        <h1>{{ r.startOn }} → {{ r.endOn }}</h1>
        <p>{{ r.status }} · {{ money(r.totalCents) }}</p>
      </section>
      @if (qr()) { <div class="qr" [innerHTML]="qr()"></div> }
      <ul>
        @for (l of r.lines; track l.pieceId) {
          <li>{{ l.name }} · {{ money(l.lineTotalCents) }}</li>
        }
      </ul>
      @if (r.status === 'paid') {
        <p id="pay-action">
          <button class="btn btn-secondary" type="button" (click)="cancel(r)">Cancelar (≥24 h)</button>
          @if (ctaError()) { <p class="cta-error">{{ ctaError() }}</p> }
        </p>
      }
    }
  `,
})
export class RentalDetailPageComponent implements OnInit {
  readonly code = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly rental = signal<Rental | null>(null);
  protected readonly qr = signal<SafeHtml | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly ctaError = signal('');
  readonly money = money;

  ngOnInit(): void {
    this.api.mineOne(this.code()).subscribe({
      next: (r) => {
        this.rental.set(r);
        if (r.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(r.qrSvg));
        this.loading.set(false);
      },
      error: () => { this.error.set('No está en tu guardarropa.'); this.loading.set(false); },
    });
  }

  cancel(r: Rental): void {
    this.ctaError.set('');
    this.api.cancel(r.id).subscribe({
      next: (u) => this.rental.set(u),
      error: (err) => {
        this.ctaError.set(humanizeApiError(err));
        document.getElementById('pay-action')?.scrollIntoView({ block: 'center' });
      },
    });
  }
}
