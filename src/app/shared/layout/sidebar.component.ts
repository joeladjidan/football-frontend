import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Router, NavigationEnd} from '@angular/router';
import {filter, Subscription} from "rxjs";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUrl = '';
  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.sub = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((evt: any) => {
          this.currentUrl = evt.urlAfterRedirects || evt.url;
        });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  isSectionOpen(section: 'gestion' | 'other'): boolean {
    // garder 'Gestion' ouvert si l'URL contient /users ou /teams
    if (section === 'gestion') {
        return this.currentUrl.startsWith('/users') || this.currentUrl.startsWith('/teams')
            || this.currentUrl.startsWith('/welcome');
    }
    return false;
  }

  isActiveRoute(routePrefix: string): boolean {
    return this.currentUrl.startsWith(routePrefix);
  }
}
