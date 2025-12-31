import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();

  // Live panel model
  live = {
    match: 'N/A',
    score: '-',
    possession: '-',
    status: 'Indisponible'
  } as any;

  private subs: Subscription[] = [];

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      try { this.router.navigateByUrl('/login'); } catch (e) { /* noop */ }
      return;
    }

    // prevent page scrollbar while on welcome page
    try { document.body.classList.add('no-scroll-home'); } catch (e) { /* noop */ }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    try { document.body.classList.remove('no-scroll-home'); } catch (e) { /* noop */ }
  }
}
