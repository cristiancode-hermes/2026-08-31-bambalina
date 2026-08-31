import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { money, type Rack } from '../shared/models';

@Component({
  selector: 'app-racks',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <h1>Percheros</h1>
      <p class="muted">Mismo «desde» que en portada: el mínimo de la tarifa diaria de cada gama.</p>
    </section>
    @if (loading()) { <p class="muted">Cargando…</p> }
    @else if (error()) {
      <section class="screen">
        <h2>No hay percheros ahora</h2>
        <p>{{ error() }}</p>
        <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
      </section>
    } @else {
      <div class="grid">
        @for (r of racks(); track r.id) {
          <a class="card" [routerLink]="['/percheros', r.slug]">
            <img [src]="r.photoUrl" [alt]="r.name" />
            <div class="card-body">
              <h3>{{ r.name }}</h3>
              <p class="price">desde {{ money(r.fromPriceCents) }} / día</p>
            </div>
          </a>
        }
      </div>
    }
  `,
})
export class RacksPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly racks = signal<Rack[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  readonly money = money;
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.racks().subscribe({
      next: (rows) => { this.racks.set(rows); this.loading.set(false); },
      error: () => { this.error.set('Catálogo no disponible.'); this.loading.set(false); },
    });
  }
}
