import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-create.component.html'
})
export class UserCreateComponent {
  form: FormGroup;
  constructor(private fb: FormBuilder, private svc: UsersService, private router: Router, private toast: ToastService) {
    this.form = this.fb.group({ username: ['', Validators.required], roles: [''] });
  }
  submit() {
    if (this.form.invalid) return;
    const username = this.form.value.username || '';
    const rolesRaw = this.form.value.roles || '';
    const dto = { username: username, roles: rolesRaw ? (rolesRaw as string).split(',').map(s => s.trim()) : [] };
    this.svc.create(dto).subscribe({ next: () => { this.toast.showSuccess('Utilisateur créé'); this.router.navigateByUrl('/users'); }, error: () => this.toast.showError('Échec création utilisateur') });
  }
}
