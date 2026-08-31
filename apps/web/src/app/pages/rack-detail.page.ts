import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { money, type Piece, type Rack } from '../shared/models';

@Component({
  selector: 'app-rack-detail',
  imports: [RouterLink],
  template: `
    @if (loading()) { <p class="muted" style="padding:32px 0">Cargando perchero…</p> }
    @else if (error()) {
      <section class="screen">
        <h2>Ese perchero no está</h2>
        <p>{{ error() }}</p>
        <a class="btn btn-primary" routerLink="/percheros">Volver a percheros</a>
      </section>
    } @else if (rack(); as r) {
      <section class="hero">
        <p class="kicker">{{ r.name }}</p>
        <h1>{{ r.tagline }}</h1>
        <p class="price">desde {{ money(r.fromPriceCents) }} / día</p>
      </section>
      <div class="grid">
        @for (p of pieces(); track p.id) {
          <a class="card" [routerLink]="['/piezas', p.id]">
            <img [src]="p.photoUrl" [alt]="p.name" />
            <div class="card-body">
              <h3>{{ p.name }}</h3>
              <figcaption class="muted">Talla {{ p.sizeLabel }}</figcaption>
              <p class="price">{{ money(p.dailyRateCents) }} / día · fianza {{ money(p.depositCents) }}</p>
            </div>
          </a>
        }
      </div>
    }
  `,
})
export class RackDetailPageComponent implements OnInit {
  readonly id = input.required<string>();
  private readonly api = inject(ApiService);
  protected readonly rack = signal<Rack | null>(null);
  protected readonly pieces = signal<Piece[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  readonly money = money;

  ngOnInit(): void {
    this.api.rack(this.id()).subscribe({
      next: (r) => {
        if ((r as any).error) { this.error.set('Perchero no encontrado.'); this.loading.set(false); return; }
        this.rack.set(r);
        this.pieces.set(r.pieces || []);
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudo abrir el perchero.'); this.loading.set(false); },
    });
  }
}
