import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared';
import { LoaderComponent } from '../../shared';
import { TeamRequest } from '../../models/team.model';
import { ToastService } from '../../shared';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-team-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, LoaderComponent],
  templateUrl: './team-create.component.html'
})
export class TeamCreateComponent {
  form: FormGroup;
  isSubmitting = false;

  // possible positions for the combo (localized)
  positions = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];

  constructor(private svc: TeamsService, private router: Router, private fb: FormBuilder, private toast: ToastService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      acronym: ['', Validators.required],
      budget: [0, [Validators.required, Validators.min(0)]],
      players: this.fb.array([])
    });
  }

  get players(): FormArray { return this.form.get('players') as FormArray; }

  addPlayer() {
    const group = this.fb.group({ name: ['', Validators.required], position: ['', Validators.required] });
    this.players.push(group);
  }

  removePlayer(index: number) { this.players.removeAt(index); }

  // helper to access control in template safely
  getControl(path: string) {
    return this.form.get(path) as any;
  }

  cancel() {
    // navigate back to list and include a refresh query param so the list component reloads
    this.router.navigate(['/teams'], { queryParams: { r: Date.now() } });
  }

  private applyBackendErrors(err: any) {
    // Tentative de propagation des erreurs côté formulaire si le backend renvoie un format connu
    try {
      const payload = err && err.error ? err.error : err;
      // format: { fieldErrors: [{ field: 'name', message: '...' }, ... ] }
      const setControlError = (path: string, message: string) => {
        // support players[0].name or players.0.name
        const normalized = path.replace(/\[(\d+)\]/g, '.$1');
        const parts = normalized.split('.');
        let ctrl: any = this.form;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (!ctrl) break;
          if (ctrl instanceof FormGroup || ctrl === this.form) {
            ctrl = ctrl.get(p);
          } else if (ctrl instanceof FormArray) {
            const idx = parseInt(p, 10);
            ctrl = ctrl.at(idx);
          } else {
            ctrl = ctrl.get ? ctrl.get(p) : null;
          }
        }
        if (ctrl) {
          ctrl.setErrors({ backend: message });
        } else {
          // fallback: toast
          this.toast.showWithOptions({ text: message, type: 'error', duration: 6000 });
        }
      };

      if (payload && Array.isArray(payload.fieldErrors)) {
        const msgs: string[] = [];
        payload.fieldErrors.forEach((fe: any) => {
          setControlError(fe.field, fe.message);
          if (fe.message) msgs.push(fe.message);
        });
        // focus first invalid control
        this.focusFirstInvalid();
        // show a short toast summary of field errors
        try { if (msgs.length) this.toast.showWithOptions({ text: msgs.slice(0,3).join(' — '), type: 'error', duration: 6000 }); } catch (e) {}
        return;
      }
      // format: { errors: { field: 'msg', ... } }
      if (payload && payload.errors && typeof payload.errors === 'object') {
        const msgs: string[] = [];
        Object.keys(payload.errors).forEach(k => {
          setControlError(k, payload.errors[k]);
          if (payload.errors[k]) msgs.push(String(payload.errors[k]));
        });
        this.focusFirstInvalid();
        try { if (msgs.length) this.toast.showWithOptions({ text: msgs.slice(0,3).join(' — '), type: 'error', duration: 6000 }); } catch (e) {}
        return;
      }
      // some APIs return an array of violations
      if (payload && Array.isArray(payload)) {
        const msgs: string[] = [];
        payload.forEach((e:any) => {
          if (e.field && e.message) {
            setControlError(e.field, e.message);
            msgs.push(e.message);
          }
        });
        this.focusFirstInvalid();
        try { if (msgs.length) this.toast.showWithOptions({ text: msgs.slice(0,3).join(' — '), type: 'error', duration: 6000 }); } catch (e) {}
        return;
      }
    } catch (e) {
      // ignore parsing errors
    }
  }

  private focusFirstInvalid() {
    try {
      // find first control with errors and focus its native element (by id if present)
      const markAndFind = (group: any, prefix = ''): string | null => {
        if (!group) return null;
        if (group['controls']) {
          for (const name of Object.keys(group.controls)) {
            const c = group.get(name);
            const path = prefix ? `${prefix}.${name}` : name;
            if (c && c.invalid) {
              // if it's a FormGroup or FormArray, recurse
              if (c['controls']) {
                const found = markAndFind(c, path);
                if (found) return found;
              } else {
                c.markAsTouched();
                return path;
              }
            }
          }
        }
        if (Array.isArray(group.controls)) {
          for (let i = 0; i < group.controls.length; i++) {
            const c = group.at(i);
            const path = `${prefix}[${i}]`;
            if (c && c.invalid) {
              if (c['controls']) {
                const found = markAndFind(c, path);
                if (found) return found;
              } else {
                c.markAsTouched();
                return path;
              }
            }
          }
        }
        return null;
      };
      const first = markAndFind(this.form);
      if (first) {
        // try to focus an element with id = last part of path
        const normalized = first.replace(/\[(\d+)\]/g, '.$1');
        const parts = normalized.split('.');
        const last = parts[parts.length - 1];
        const el = document.querySelector<HTMLInputElement>(`#${last}`) || document.querySelector<HTMLInputElement>(`input[formControlName='${last}']`);
        if (el) el.focus();
      }
    } catch (e) {
      // noop
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.showWithOptions({ text: 'Veuillez corriger les erreurs du formulaire', type: 'error', duration: 5000 });
      return;
    }
    this.isSubmitting = true;
    const payload: TeamRequest = this.form.value;
    this.svc.create(payload).subscribe({
      next: () => {
        this.toast.show('Équipe créée avec succès', 'success');
        // navigate back to list and force a refresh
        this.router.navigate(['/teams'], { queryParams: { r: Date.now() } });
        this.isSubmitting = false;
      },
      error: (err: any) => {
        this.isSubmitting = false;
        // try to attach field errors to form controls
        this.applyBackendErrors(err);
        // show a toast with a readable message
        let displayMsg = 'Erreur serveur';
        try {
          if (err) {
            if (typeof err === 'string') displayMsg = err;
            else if (err.error && (err.error.message || err.error.error)) displayMsg = err.error.message || err.error.error;
            else if (err.message) displayMsg = err.message;
            else displayMsg = JSON.stringify(err);
          }
        } catch (e) {
          displayMsg = 'Erreur serveur';
        }
        // use showWithOptions to allow duration/action and ensure toast component receives a full object
        this.toast.showWithOptions({ text: displayMsg, type: 'error', duration: 6000 });
      }
    });
  }
}
