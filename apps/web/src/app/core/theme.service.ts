import { Injectable, signal } from '@angular/core';

const KEY = 'bambalina.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    let initial: 'light' | 'dark' = 'light';
    try {
      const stored = localStorage.getItem(KEY) as 'light' | 'dark' | null;
      if (stored === 'dark' || stored === 'light') initial = stored;
    } catch {
      /* ignore */
    }
    this.apply(initial);
  }

  toggle(): void {
    this.apply(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(mode: 'light' | 'dark'): void {
    this.theme.set(mode);
    document.documentElement.setAttribute('data-theme', mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
  }
}
