import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { humanizeApiError } from '../shared/models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-split">
      <aside class="auth-brand-col">
        <p class="kicker" style="color:#E2C48A">Bambalina</p>
        <h1>La capa no se retiene un cuarto de hora. Se paga, se cuelga de nuevo.</h1>
        <p>Guardarropa de atrezo para intérpretes de barrio.</p>
      </aside>
      <div class="auth-form-side">
        <form class="auth-form" (ngSubmit)="submit()">
          <h2>Entrar</h2>
          <label for="identifier">Usuario o email</label>
          <input id="identifier" name="identifier" autocomplete="off"
            [ngModel]="identifier()" (ngModelChange)="identifier.set($event)" />
          <label for="password">Contraseña</label>
          <input id="password" name="password" type="password" autocomplete="new-password"
            [ngModel]="password()" (ngModelChange)="password.set($event)" />
          @if (error()) { <p class="cta-error">{{ error() }}</p> }
          <button class="btn btn-primary" type="submit" style="margin-top:16px;width:100%" [disabled]="auth.loading()">Entrar</button>
          <p class="muted" style="margin-top:12px">¿Sin cuenta? <a routerLink="/registro">Regístrate</a></p>
          <div class="auth-demo">
            <strong>Cuenta de prueba con datos</strong><br />
            Cliente: <code>demo@bambalina.dev</code> · <code>demo1234</code><br />
            Staff: <code>staff@bambalina.dev</code> · <code>demo1234</code>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  public auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly identifier = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');

  submit(): void {
    this.error.set('');
    this.auth.login({ identifier: this.identifier(), password: this.password() }).subscribe({
      next: () => {
        const ret = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        void this.router.navigateByUrl(ret);
      },
      error: (err) => this.error.set(humanizeApiError(err)),
    });
  }
}
