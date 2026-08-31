import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-account',
  template: `
    <section class="hero">
      <h1>Cuenta</h1>
      @if (auth.user(); as u) {
        <p>{{ u.displayName || u.username }} · {{ u.email }}</p>
      }
      <p class="price">Puntos de percha: {{ points() }} (días devueltos)</p>
      <p class="muted">Los puntos salen de alquileres devueltos, no de un saldo semilla.</p>
    </section>
  `,
})
export class AccountPageComponent implements OnInit {
  public auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly points = signal(0);
  ngOnInit(): void {
    this.api.myStats().subscribe({ next: (s) => this.points.set(s.points) });
  }
}
