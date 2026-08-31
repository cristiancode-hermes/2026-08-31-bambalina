import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="screen">
      <h1>Esa percha no existe</h1>
      <p>La ruta no está en el guardarropa.</p>
      <a class="btn btn-primary" routerLink="/">Volver al inicio</a>
    </section>
  `,
})
export class NotFoundPageComponent {}
