import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { Router } from '@angular/router';
import { ToastService, ButtonComponent, LoaderComponent } from '../../shared';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, LoaderComponent],
  templateUrl: './user-create.component.html'
})
export class UserCreateComponent {
  form: FormGroup;
  isSubmitting = false;
  constructor(private fb: FormBuilder, private svc: UsersService, private router: Router, private toast: ToastService) {
    this.form = this.fb.group({ username: ['', Validators.required], roles: [''] });
  }
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.showWithOptions({ text: 'Veuillez corriger les erreurs du formulaire', type: 'error', duration: 5000 });
      // ancien appel incorrect à ngx-toastr supprimé
      return;
    }
    this.isSubmitting = true;
    // show an informative toast while the creation request runs
    try { this.toast.showInfo("Création de l'utilisateur en cours..."); } catch (e) { /* noop */ }
    const username = this.form.value.username || '';
    const rolesRaw = this.form.value.roles || '';
    const dto = { username: username, roles: rolesRaw ? (rolesRaw as string).split(',').map(s => s.trim()) : [] };
    this.svc.create(dto).subscribe({ next: () => { this.isSubmitting = false; this.toast.showSuccess('Utilisateur créé'); this.router.navigateByUrl('/users'); }, error: () => { this.isSubmitting = false; this.toast.showError('Échec création utilisateur'); } });
  }

  getControl(path: string) { return this.form.get(path) as any; }

  cancel() { this.router.navigate(['/users'], { queryParams: { r: Date.now() } }); }
}
