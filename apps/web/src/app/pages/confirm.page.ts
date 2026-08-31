import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { money, type Rental } from '../shared/models';

@Component({
  selector: 'app-confirm',
  imports: [RouterLink],
  template: `
    @if (loading()) { <p class="muted" style="padding:32px 0">Preparando comprobante…</p> }
    @else if (error()) {
      <section class="screen">
        <h2>No encontramos el alquiler</h2>
        <p>{{ error() }}</p>
        <a class="btn btn-primary" routerLink="/mis-alquileres">Mis alquileres</a>
      </section>
    } @else if (rental(); as r) {
      <section class="hero">
        <p class="kicker">Pagado</p>
        <h1>Tu percha está lista</h1>
        <p class="mono">{{ r.code }} · {{ r.startOn }} → {{ r.endOn }}</p>
        <p class="price">{{ money(r.totalCents) }}</p>
      </section>
      @if (qr()) {
        <div class="qr" [innerHTML]="qr()"></div>
        <p><a [href]="r.qrUrl">{{ r.qrUrl }}</a></p>
      }
      <p style="margin-top:16px"><a class="btn btn-secondary" [routerLink]="['/mis-alquileres', r.code]">Ver detalle</a></p>
    }
  `,
})
export class ConfirmPageComponent implements OnInit {
  readonly code = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly rental = signal<Rental | null>(null);
  protected readonly qr = signal<SafeHtml | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  readonly money = money;

  ngOnInit(): void {
    this.api.mineOne(this.code()).subscribe({
      next: (r) => {
        this.rental.set(r);
        if (r.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(r.qrSvg));
        this.loading.set(false);
      },
      error: () => { this.error.set('El comprobante no está.'); this.loading.set(false); },
    });
  }
}
