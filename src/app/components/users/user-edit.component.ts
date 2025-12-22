import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { UsersService, UserDto } from '../../services/users.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToastService } from '../../shared';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-edit.component.html'
})
export class UserEditComponent implements OnInit {
  form: FormGroup;
  id?: number;
  constructor(private route: ActivatedRoute, private fb: FormBuilder, private svc: UsersService, private router: Router, private toast: ToastService) {
    this.form = this.fb.group({ username: ['', Validators.required], roles: [''] });
  }
  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.toast.showError('Utilisateur introuvable'); this.router.navigateByUrl('/users'); return; }
    this.id = id;
    this.svc.get(id).subscribe({ next: u => { this.form.patchValue({ username: u.username, roles: u.roles?.join(', ') }); }, error: () => { this.toast.showError('Impossible de charger l\'utilisateur'); this.router.navigateByUrl('/users'); } });
  }
  save() {
    if (!this.id) return;
    if (this.form.invalid) return;
    const username = this.form.value.username || '';
    const rolesRaw = this.form.value.roles || '';
    const dto: UserDto = { username, roles: rolesRaw ? (rolesRaw as string).split(',').map(s => s.trim()) : [] };
    this.svc.update(this.id, dto).subscribe({ next: () => { this.toast.showSuccess('Utilisateur mis à jour'); this.router.navigateByUrl('/users'); }, error: () => this.toast.showError('Erreur lors de la mise à jour') });
  }
}
