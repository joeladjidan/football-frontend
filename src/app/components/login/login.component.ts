import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../shared';
import { ButtonComponent } from '../../shared';
import { ToastService } from '../../shared';

interface LoginResponse { token: string; }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;

  constructor(private auth: AuthService, private router: Router, private fb: FormBuilder, private toast: ToastService, private location: Location) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false] // Ajout du contrôle 'remember'
    });
  }

  goBack(): void {
    try { this.location.back(); } catch { this.router.navigateByUrl('/'); }
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { username, password } = this.loginForm.value;
    if (this.isSubmitting) return; // garde-fou défensif pour éviter les soumissions doubles
    this.isSubmitting = true;
    this.auth.login(username, password).subscribe({
      next: (res: LoginResponse) => {
        this.auth.setToken(res.token);
        this.router.navigateByUrl('/welcome');
        this.isSubmitting = false;
      },
      error: (err) => {
        this.toast.showError('Échec de connexion : ' + (err?.error?.message || 'Erreur serveur'));
        this.isSubmitting = false;
      }
    });
  }
}
