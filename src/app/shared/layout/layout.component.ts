import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { FooterComponent } from './footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  @Input() minimalOverride?: boolean;

  constructor(private router: Router) {}

  get isMinimal(): boolean {
    if (typeof this.minimalOverride !== 'undefined') return !!this.minimalOverride;
    try {
      const url = this.router.url || '';
      return url.startsWith('/login');
    } catch {
      return false;
    }
  }
}
