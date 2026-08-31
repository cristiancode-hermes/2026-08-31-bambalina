import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { money, type Piece } from '../shared/models';

@Component({
  selector: 'app-piece',
  imports: [RouterLink],
  template: `
    @if (loading()) { <p class="muted" style="padding:32px 0">Cargando prenda…</p> }
    @else if (error()) {
      <section class="screen">
        <h2>Prenda no encontrada</h2>
        <p>{{ error() }}</p>
        <a class="btn btn-primary" routerLink="/percheros">Volver</a>
      </section>
    } @else if (piece(); as p) {
      <section class="hero" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:center">
        <figure style="margin:0">
          <img [src]="p.photoUrl" [alt]="p.name" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;border:1px solid var(--color-border)" />
          <figcaption class="muted" style="margin-top:8px">{{ p.name }} · talla {{ p.sizeLabel }}</figcaption>
        </figure>
        <div>
          <h1>{{ p.name }}</h1>
          <p class="price">{{ money(p.dailyRateCents) }} / día · fianza {{ money(p.depositCents) }}</p>
          @if (p.fabricNotes) {
            <p class="muted">{{ p.fabricNotes['tejido'] }} · {{ p.fabricNotes['epoca'] }} · {{ p.fabricNotes['cuidados'] }}</p>
          }
          <p style="margin-top:16px">
            <button class="btn btn-primary" type="button" (click)="goCheckout(p)">Alquilar estas fechas</button>
          </p>
        </div>
      </section>
    }
  `,
  styles: [`@media (max-width: 768px) { section.hero { grid-template-columns: 1fr !important; } }`],
})
export class PiecePageComponent implements OnInit {
  readonly id = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly piece = signal<Piece | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  readonly money = money;

  ngOnInit(): void {
    this.api.piece(this.id()).subscribe({
      next: (p) => {
        if ((p as any).error) { this.error.set('No está en el perchero.'); this.loading.set(false); return; }
        this.piece.set(p);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar la prenda.'); this.loading.set(false); },
    });
  }

  goCheckout(p: Piece): void {
    try {
      const raw = sessionStorage.getItem('bambalina.pieceIds');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (!ids.includes(p.id) && ids.length < 4) ids.push(p.id);
      sessionStorage.setItem('bambalina.pieceIds', JSON.stringify(ids));
    } catch { /* ignore */ }
    void this.router.navigateByUrl('/checkout');
  }
}
