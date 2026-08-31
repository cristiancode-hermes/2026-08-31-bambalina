import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { humanizeApiError, money, type Rental } from '../shared/models';

@Component({
  selector: 'app-staff',
  imports: [FormsModule],
  template: `
    <section class="hero">
      <h1>Percha</h1>
      <p class="muted">Escanea el código o pega la URL del alquiler.</p>
    </section>
    <label>Código o URL</label>
    <input [ngModel]="code()" (ngModelChange)="code.set($event)" autocomplete="off" />
    <div id="scan-action" style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
      <button class="btn btn-primary" type="button" (click)="pickup()">Salida</button>
      <button class="btn btn-secondary" type="button" (click)="ret()">Devolución</button>
    </div>
    @if (ctaError()) { <p class="cta-error">{{ ctaError() }}</p> }
    @if (result(); as r) {
      <p style="margin-top:16px">{{ r.status }} · {{ r.code }} · {{ money(r.totalCents) }} @if (late() > 0) { · recargo {{ money(late()) }} }</p>
    }
  `,
})
export class StaffPageComponent {
  private readonly api = inject(ApiService);
  protected readonly code = signal('');
  protected readonly ctaError = signal('');
  protected readonly result = signal<Rental | null>(null);
  protected readonly late = signal(0);
  readonly money = money;

  pickup(): void {
    this.ctaError.set('');
    this.api.pickup(this.code()).subscribe({
      next: (r) => this.result.set(r.rental),
      error: (err) => {
        this.ctaError.set(humanizeApiError(err));
        document.getElementById('scan-action')?.scrollIntoView({ block: 'center' });
      },
    });
  }

  ret(): void {
    this.ctaError.set('');
    this.api.returnScan(this.code()).subscribe({
      next: (r) => { this.result.set(r.rental); this.late.set(r.lateFeeCents || 0); },
      error: (err) => {
        this.ctaError.set(humanizeApiError(err));
        document.getElementById('scan-action')?.scrollIntoView({ block: 'center' });
      },
    });
  }
}
