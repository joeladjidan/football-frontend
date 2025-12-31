import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastComponent } from './shared';
import { ThemeService } from './core/theme.service';
import {LayoutComponent} from "./shared/layout/layout.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent,LayoutComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(public auth: AuthService, private router: Router, private theme: ThemeService) {}

  ngOnInit(): void {
    // Appliquer le thème sauvegardé (si présent)
    try { this.theme.applyTheme(this.theme.getTheme()); } catch {}

    // Si l'utilisateur ouvre la racine '/', rediriger dynamiquement selon l'état d'authentification
    try {
      const path = window.location.pathname || '/';
      if (path === '/' || path === '') {
        if (this.auth.isLoggedIn()) {
          this.router.navigate(['/welcome']);
        } else {
          this.router.navigate(['/login']);
        }
      }
    } catch (e) {
      // noop
    }
  }
}
