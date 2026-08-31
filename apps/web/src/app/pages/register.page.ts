import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { humanizeApiError } from '../shared/models';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-split">
      <aside class="auth-brand-col">
        <p class="kicker" style="color:#E2C48A">Bambalina</p>
        <h1>Abre ficha de intérprete</h1>
        <p>Alquila por fechas. Recoge y devuelve con QR de percha.</p>
      </aside>
      <div class="auth-form-side">
        <form class="auth-form" (ngSubmit)="submit()">
          <h2>Registro</h2>
          <label for="username">Usuario</label>
          <input id="username" name="username" autocomplete="off" [ngModel]="username()" (ngModelChange)="username.set($event)" />
          <label for="email">Email</label>
          <input id="email" name="email" autocomplete="off" [ngModel]="email()" (ngModelChange)="email.set($event)" />
          <label for="password">Contraseña</label>
          <input id="password" name="password" type="password" autocomplete="new-password" [ngModel]="password()" (ngModelChange)="password.set($event)" />
          @if (error()) { <p class="cta-error">{{ error() }}</p> }
          <button class="btn btn-primary" type="submit" style="margin-top:16px;width:100%" [disabled]="auth.loading()">Crear cuenta</button>
          <p class="muted" style="margin-top:12px">¿Ya tienes ficha? <a routerLink="/login">Entrar</a></p>
        </form>
      </div>
    </div>
  `,
})
export class RegisterPageComponent {
  public auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly username = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');

  submit(): void {
    this.error.set('');
    this.auth.register({ username: this.username(), email: this.email(), password: this.password() }).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (err) => this.error.set(humanizeApiError(err)),
    });
  }
}
