import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { humanizeApiError, madridToday, money, type Addon, type Piece } from '../shared/models';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule],
  template: `
    <section class="hero">
      <h1>Alquilar por fechas</h1>
      <p class="muted">Total en vivo antes de pagar. Sin retención de hueco.</p>
    </section>
    <div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,0.8fr);gap:24px">
      <div>
        <label>Recogida</label>
        <input type="date" [ngModel]="startOn()" (ngModelChange)="startOn.set($event); refresh()" />
        <label>Devolución</label>
        <input type="date" [ngModel]="endOn()" (ngModelChange)="endOn.set($event); refresh()" />
        <h2 style="margin-top:24px">Prendas</h2>
        @if (loading()) { <p class="muted">Buscando disponibilidad…</p> }
        @else if (loadError()) {
          <section class="screen">
            <h2>No se pudo cargar el perchero</h2>
            <p>{{ loadError() }}</p>
            <button class="btn btn-primary" type="button" (click)="refresh()">Reintentar</button>
          </section>
        } @else if (!pieces().length) {
          <section class="screen">
            <h2>Nada colgado para esas fechas</h2>
            <p>Prueba otro rango de 1 a 14 días.</p>
          </section>
        } @else {
          <div class="grid">
            @for (p of pieces(); track p.id) {
              <button type="button" class="piece"
                [class.is-taken]="p.available === false"
                [class.is-picked]="selected().includes(p.id)"
                [disabled]="p.available === false"
                (click)="toggle(p)">
                <strong>{{ p.name }}</strong><br />
                <span>{{ money(p.dailyRateCents) }}/día · fianza {{ money(p.depositCents) }}</span><br />
                <span>{{ p.available === false ? 'Ocupada esas fechas' : 'Libre' }}</span>
              </button>
            }
          </div>
        }
        <h2 style="margin-top:24px">Extras</h2>
        @for (a of addons(); track a.id) {
          <label style="display:flex;gap:8px;align-items:center;min-height:44px">
            <input type="checkbox" [checked]="addonIds().includes(a.id)" (change)="toggleAddon(a.id)" />
            {{ a.name }} · {{ money(a.priceCents) }}
          </label>
        }
      </div>
      <aside class="card" style="align-self:start">
        <div class="card-body">
          <h3>Resumen</h3>
          @for (p of selectedPieces(); track p.id) {
            <p>{{ p.name }} · {{ days() }} d × {{ money(p.dailyRateCents) }}</p>
          }
          @for (a of selectedAddons(); track a.id) {
            <p>{{ a.name }} · {{ money(a.priceCents) }}</p>
          }
          <p>Fianza {{ money(deposit()) }}</p>
          <p class="price">Total {{ money(total()) }}</p>
          <div id="pay-action">
            <button class="btn btn-primary" type="button" style="width:100%" [disabled]="paying() || !selected().length" (click)="pay()">Pagar ahora</button>
            @if (ctaError()) { <p class="cta-error">{{ ctaError() }}</p> }
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`@media (max-width: 768px) { :host > div { display:block !important; } }`],
})
export class CheckoutPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly startOn = signal(madridToday());
  protected readonly endOn = signal(madridToday());
  protected readonly pieces = signal<Piece[]>([]);
  protected readonly addons = signal<Addon[]>([]);
  protected readonly selected = signal<string[]>([]);
  protected readonly addonIds = signal<string[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly ctaError = signal('');
  protected readonly paying = signal(false);
  readonly money = money;

  readonly days = computed(() => {
    const a = Date.parse(this.startOn() + 'T00:00:00Z');
    const b = Date.parse(this.endOn() + 'T00:00:00Z');
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
    return Math.round((b - a) / 86400000) + 1;
  });
  readonly selectedPieces = computed(() => this.pieces().filter((p) => this.selected().includes(p.id)));
  readonly selectedAddons = computed(() => this.addons().filter((a) => this.addonIds().includes(a.id)));
  readonly deposit = computed(() => this.selectedPieces().reduce((s, p) => s + p.depositCents, 0));
  readonly total = computed(() => {
    const d = this.days();
    const lines = this.selectedPieces().reduce((s, p) => s + p.dailyRateCents * d, 0);
    const extras = this.selectedAddons().reduce((s, a) => s + a.priceCents, 0);
    return lines + extras + this.deposit();
  });

  ngOnInit(): void {
    try {
      const ids = JSON.parse(sessionStorage.getItem('bambalina.pieceIds') || '[]');
      if (Array.isArray(ids)) this.selected.set(ids);
    } catch { /* ignore */ }
    this.api.addons().subscribe({ next: (a) => this.addons.set(a) });
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.api.pieces({ startOn: this.startOn(), endOn: this.endOn() }).subscribe({
      next: (rows) => { this.pieces.set(rows); this.loading.set(false); },
      error: () => { this.loadError.set('El catálogo no responde.'); this.loading.set(false); },
    });
  }

  toggle(p: Piece): void {
    if (p.available === false) return;
    const cur = this.selected();
    const next = cur.includes(p.id) ? cur.filter((id) => id !== p.id) : cur.length < 4 ? [...cur, p.id] : cur;
    this.selected.set(next);
    try { sessionStorage.setItem('bambalina.pieceIds', JSON.stringify(next)); } catch { /* ignore */ }
  }

  toggleAddon(id: string): void {
    const cur = this.addonIds();
    this.addonIds.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  pay(): void {
    this.ctaError.set('');
    this.paying.set(true);
    this.api.checkout({
      startOn: this.startOn(),
      endOn: this.endOn(),
      pieceIds: this.selected(),
      addonIds: this.addonIds(),
    }).subscribe({
      next: (r) => {
        this.paying.set(false);
        void this.router.navigate(['/confirmacion', r.code]);
      },
      error: (err) => {
        this.paying.set(false);
        this.ctaError.set(humanizeApiError(err));
        document.getElementById('pay-action')?.scrollIntoView({ block: 'center' });
      },
    });
  }
}
