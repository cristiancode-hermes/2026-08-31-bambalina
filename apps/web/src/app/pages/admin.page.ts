import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-admin',
  template: `
    <section class="hero">
      <h1>Ocupación 14 días</h1>
      <p class="muted">Piezas con solape por día civil (Madrid). Ejes, fechas y tooltip.</p>
    </section>
    @if (loading()) { <p class="muted">Cargando gráfico…</p> }
    @else if (error()) {
      <section class="screen">
        <h2>No hay ocupación</h2>
        <p>{{ error() }}</p>
        <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
      </section>
    } @else {
      <svg class="chart" viewBox="0 0 640 220" role="img" [attr.aria-label]="'Ocupación por día'">
        <line x1="40" y1="180" x2="620" y2="180" stroke="currentColor" />
        <line x1="40" y1="20" x2="40" y2="180" stroke="currentColor" />
        @for (d of days(); track d.date; let i = $index) {
          <rect
            [attr.x]="40 + i * 40"
            [attr.y]="180 - d.pct * 1.4"
            width="28"
            [attr.height]="d.pct * 1.4"
            fill="var(--color-primary)"
            (mouseenter)="tip.set(d.date + ': ' + d.busy + '/' + d.total + ' (' + d.pct + '%)')"
            (mouseleave)="tip.set('')" />
          <text [attr.x]="54 + i * 40" y="198" font-size="9" text-anchor="middle" fill="currentColor">{{ d.date.slice(5) }}</text>
        }
        <text x="8" y="24" font-size="10" fill="currentColor">%</text>
      </svg>
      @if (tip()) { <p class="muted">{{ tip() }}</p> }
    }
  `,
})
export class AdminPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly days = signal<Array<{ date: string; busy: number; total: number; pct: number }>>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly tip = signal('');
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.occupancy().subscribe({
      next: (rows) => { this.days.set(rows); this.loading.set(false); },
      error: () => { this.error.set('El gráfico no está disponible.'); this.loading.set(false); },
    });
  }
}
