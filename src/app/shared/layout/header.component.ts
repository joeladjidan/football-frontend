import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../button/button.component';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() minimal = false;
  currentTheme: string | null = null;

  constructor(public auth: AuthService, private theme: ThemeService, private router: Router) {}

  ngOnInit(): void {
    this.currentTheme = this.theme.getTheme();
  }

  toggleSidebar(event?: Event) {
    if (event) { event.preventDefault(); }
    const body = document.body;
    body.classList.toggle('sidebar-open');
  }

  toggleTheme() {
    this.theme.toggleClassic();
    this.currentTheme = this.theme.getTheme();
  }

  get themeLabel(): string {
    return this.currentTheme === 'classic' ? 'Classic' : 'OGC';
  }

  get themeIcon(): string {
    return this.currentTheme === 'classic' ? '☀️' : '⚑';
  }

  logout() {
    try { this.auth.logout(); } catch (e) { /* noop */ }
    try { this.router.navigateByUrl('/login'); } catch (e) { /* noop */ }
  }
}
