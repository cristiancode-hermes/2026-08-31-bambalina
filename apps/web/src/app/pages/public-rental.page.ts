import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../core/api.service';
import { money, type Rental } from '../shared/models';

@Component({
  selector: 'app-public-rental',
  template: `
    <div class="wrap" style="padding:48px 0">
      @if (loading()) { <p class="muted">Abriendo pase…</p> }
      @else if (error()) {
        <section class="screen">
          <h2>Pase no encontrado</h2>
          <p>{{ error() }}</p>
        </section>
      } @else if (rental(); as r) {
        <p class="kicker">Bambalina</p>
        <h1>Alquiler {{ r.code }}</h1>
        <p>{{ r.startOn }} → {{ r.endOn }} · {{ r.status }}</p>
        <p class="price">{{ money(r.totalCents) }}</p>
        @if (qr()) { <div class="qr" [innerHTML]="qr()"></div> }
        <ul>
          @for (l of r.lines || []; track l.pieceId) {
            <li>{{ l.name }} · {{ l.days }} días</li>
          }
        </ul>
      }
    </div>
  `,
})
export class PublicRentalPageComponent implements OnInit {
  readonly code = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly rental = signal<Rental | null>(null);
  protected readonly qr = signal<SafeHtml | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  readonly money = money;

  ngOnInit(): void {
    this.api.publicRental(this.code()).subscribe({
      next: (r) => {
        this.rental.set(r);
        if (r.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(r.qrSvg));
        this.loading.set(false);
      },
      error: () => { this.error.set('Ese código no cuelga de ninguna percha.'); this.loading.set(false); },
    });
  }
}
