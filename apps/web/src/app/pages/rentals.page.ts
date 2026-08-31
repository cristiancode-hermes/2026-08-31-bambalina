import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { money, type Rental } from '../shared/models';

@Component({
  selector: 'app-rentals',
  imports: [RouterLink],
  template: `
    <section class="hero"><h1>Mis alquileres</h1></section>
    @if (loading()) { <p class="muted">Cargando…</p> }
    @else if (error()) {
      <section class="screen">
        <h2>No pudimos abrir tus alquileres</h2>
        <p>{{ error() }}</p>
        <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
      </section>
    } @else if (!rows().length) {
      <section class="screen">
        <h2>Aún no has colgado nada</h2>
        <p>Elige un perchero y un rango de fechas.</p>
        <a class="btn btn-primary" routerLink="/percheros">Ver percheros</a>
      </section>
    } @else {
      <div class="grid">
        @for (r of rows(); track r.id) {
          <a class="card" [routerLink]="['/mis-alquileres', r.code]">
            <div class="card-body">
              <p class="mono">{{ r.code }}</p>
              <h3>{{ r.startOn }} → {{ r.endOn }}</h3>
              <p>{{ r.status }} · {{ money(r.totalCents) }}</p>
            </div>
          </a>
        }
      </div>
    }
  `,
})
export class RentalsPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly rows = signal<Rental[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  readonly money = money;
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.mine().subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: () => { this.error.set('Lista no disponible.'); this.loading.set(false); },
    });
  }
}
