import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="shell-header">
      <div class="wrap nav">
        <a routerLink="/" class="brand">Bambalina</a>
        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
          <a routerLink="/percheros">Percheros</a>
          <a routerLink="/checkout">Alquilar</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/mis-alquileres">Mis alquileres</a>
            <a routerLink="/cuenta">Cuenta</a>
            @if (auth.isStaff()) {
              <a routerLink="/staff">Percha</a>
              <a routerLink="/admin">Ocupación</a>
            }
            <button class="btn btn-ghost" type="button" (click)="auth.logout()">Salir</button>
          } @else {
            <a routerLink="/login">Entrar</a>
          }
          <button class="theme-toggle" type="button" (click)="theme.toggle()" [attr.aria-label]="theme.theme() === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'">
            @if (theme.theme() === 'dark') { <span aria-hidden="true">☀</span> } @else { <span aria-hidden="true">☾</span> }
          </button>
        </nav>
      </div>
    </header>
    <main class="wrap" style="padding-bottom:64px">
      <router-outlet />
    </main>
  `,
})
export class ShellComponent {
  public auth = inject(AuthService);
  public theme = inject(ThemeService);
}
