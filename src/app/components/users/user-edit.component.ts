import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { UsersService, UserDto } from '../../services/users.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToastService, ButtonComponent, LoaderComponent } from '../../shared';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent, LoaderComponent],
  templateUrl: './user-edit.component.html'
})
export class UserEditComponent implements OnInit {
  form: FormGroup;
  id?: number;
  isSubmitting = false;
  constructor(private route: ActivatedRoute, private fb: FormBuilder, private svc: UsersService, private router: Router, private toast: ToastService) {
    this.form = this.fb.group({ username: ['', Validators.required], roles: [''] });
  }
  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.toast.showError('Utilisateur introuvable'); this.router.navigateByUrl('/users'); return; }
    this.id = id;
    this.svc.get(id).subscribe({ next: u => {
        const rolesVal = (() => {
          if (!u || u.roles == null) return '';
          if (Array.isArray(u.roles)) return u.roles.join(', ');
          if (typeof u.roles === 'string') return u.roles;
          try { return String(u.roles); } catch (e) { return ''; }
        })();
        this.form.patchValue({ username: u.username, roles: rolesVal });
      }, error: () => { this.toast.showError('Impossible de charger l\'utilisateur'); this.router.navigateByUrl('/users'); } });
  }
  save() {
    if (!this.id) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    const username = this.form.value.username || '';
    const rolesRaw = this.form.value.roles || '';
    const dto: UserDto = { username, roles: rolesRaw ? (rolesRaw as string).split(',').map(s => s.trim()) : [] };
    this.svc.update(this.id, dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.showSuccess('Utilisateur mis à jour');
        this.router.navigateByUrl('/users');
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.showError('Erreur lors de la mise à jour');
      }
    });
  }

  getControl(path: string) {
    return this.form.get(path) as any;
  }

  cancel() {
    this.router.navigate(['/users'], { queryParams: { r: Date.now() } });
  }
}
