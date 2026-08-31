import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPageComponent) },
  { path: 'entrar', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPageComponent) },
  { path: 'registro', loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPageComponent) },
  { path: 'alquiler/:code', loadComponent: () => import('./pages/public-rental.page').then((m) => m.PublicRentalPageComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/home.page').then((m) => m.HomePageComponent) },
      { path: 'percheros', loadComponent: () => import('./pages/racks.page').then((m) => m.RacksPageComponent) },
      { path: 'percheros/:id', loadComponent: () => import('./pages/rack-detail.page').then((m) => m.RackDetailPageComponent) },
      { path: 'piezas/:id', loadComponent: () => import('./pages/piece.page').then((m) => m.PiecePageComponent) },
      { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./pages/checkout.page').then((m) => m.CheckoutPageComponent) },
      { path: 'confirmacion/:code', canActivate: [authGuard], loadComponent: () => import('./pages/confirm.page').then((m) => m.ConfirmPageComponent) },
      { path: 'mis-alquileres', canActivate: [authGuard], loadComponent: () => import('./pages/rentals.page').then((m) => m.RentalsPageComponent) },
      { path: 'mis-alquileres/:code', canActivate: [authGuard], loadComponent: () => import('./pages/rental-detail.page').then((m) => m.RentalDetailPageComponent) },
      { path: 'staff', canActivate: [authGuard, roleGuard(['staff', 'admin'])], loadComponent: () => import('./pages/staff.page').then((m) => m.StaffPageComponent) },
      { path: 'admin', canActivate: [authGuard, roleGuard(['staff', 'admin'])], loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPageComponent) },
      { path: 'cuenta', canActivate: [authGuard], loadComponent: () => import('./pages/account.page').then((m) => m.AccountPageComponent) },
      { path: '**', loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPageComponent) },
    ],
  },
];
