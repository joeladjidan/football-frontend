import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeKey = 'app_theme';

  getTheme(): string | null {
    try { return localStorage.getItem(this.themeKey); } catch { return null; }
  }

  setTheme(name: string | null = null) {
    try {
      if (name) { localStorage.setItem(this.themeKey, name); }
      else { localStorage.removeItem(this.themeKey); }
    } catch {}
    this.applyTheme(name);
  }

  applyTheme(name: string | null = null) {
    const root = document.documentElement;
    // clear existing theme attributes
    root.removeAttribute('data-theme');
    if (name) {
      root.setAttribute('data-theme', name);
    }
  }

  toggleClassic() {
    const current = this.getTheme();
    if (current === 'classic') { this.setTheme(); } else { this.setTheme('classic'); }
  }
}
