import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { money, type Rack } from '../shared/models';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <p class="kicker">Bambalina</p>
      <h1>Guardarropa de atrezo para quien necesita una capa de verdad dos días.</h1>
      <p class="muted" style="max-width:62ch">Elige perchero, marca fechas civiles de Madrid, paga y recoge con QR. La prenda vuelve. No hay huecos de hoy ni retención de quince minutos.</p>
      <p style="margin-top:20px"><a class="btn btn-primary" routerLink="/percheros">Ver percheros</a></p>
    </section>
    @if (loading()) {
      <p class="muted">Cargando percheros…</p>
    } @else if (error()) {
      <section class="screen">
        <h2>No pudimos abrir el guardarropa</h2>
        <p>{{ error() }}</p>
        <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
      </section>
    } @else if (!racks().length) {
      <section class="screen">
        <h2>El perchero está vacío</h2>
        <p>Aún no hay gamas colgadas.</p>
      </section>
    } @else {
      <div class="grid">
        @for (r of racks(); track r.id) {
          <a class="card" [routerLink]="['/percheros', r.slug]">
            <img [src]="r.photoUrl" [alt]="r.name" />
            <div class="card-body">
              <h3>{{ r.name }}</h3>
              <p class="muted">{{ r.tagline }}</p>
              <p class="price">desde {{ money(r.fromPriceCents) }} / día</p>
            </div>
          </a>
        }
      </div>
    }
  `,
})
export class HomePageComponent implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly racks = signal<Rack[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  readonly money = money;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.racks().subscribe({
      next: (rows) => { this.racks.set(rows); this.loading.set(false); },
      error: () => { this.error.set('El catálogo no responde.'); this.loading.set(false); },
    });
  }
}
