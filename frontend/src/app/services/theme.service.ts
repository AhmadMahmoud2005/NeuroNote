import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeKey = 'theme';
  private readonly compactKey = 'compactLayout';

  init(): void {
    this.applyTheme(localStorage.getItem(this.themeKey) === 'dark');
    this.applyCompactLayout(localStorage.getItem(this.compactKey) !== 'false');
  }

  isDarkMode(): boolean {
    return localStorage.getItem(this.themeKey) === 'dark';
  }

  isCompactLayout(): boolean {
    return localStorage.getItem(this.compactKey) !== 'false';
  }

  setDarkMode(enabled: boolean): void {
    localStorage.setItem(this.themeKey, enabled ? 'dark' : 'light');
    this.applyTheme(enabled);
  }

  setCompactLayout(enabled: boolean): void {
    localStorage.setItem(this.compactKey, String(enabled));
    this.applyCompactLayout(enabled);
  }

  toggleDarkMode(): boolean {
    const next = !this.isDarkMode();
    this.setDarkMode(next);
    return next;
  }

  toggleCompactLayout(): boolean {
    const next = !this.isCompactLayout();
    this.setCompactLayout(next);
    return next;
  }

  private applyTheme(isDark: boolean): void {
    document.body.classList.toggle('dark-theme', isDark);
  }

  private applyCompactLayout(isCompact: boolean): void {
    document.body.classList.toggle('compact-layout', isCompact);
  }
}
