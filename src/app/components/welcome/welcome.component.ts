import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  currentYear = new Date().getFullYear();

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // If guard somehow didn't run, double-check and redirect to login
    if (!this.auth.isLoggedIn()) {
      try { this.router.navigateByUrl('/login'); } catch (e) { /* noop */ }
    }
  }
}
