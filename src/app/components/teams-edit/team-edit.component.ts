import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { TeamsService } from '../../services/teams.service';
import { ToastService } from '../../shared';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '../../shared';

@Component({
    selector: 'app-team-edit',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent],
    templateUrl: './team-edit.component.html',
    styleUrls: ['./team-edit.component.css']
})
export class TeamEditComponent implements OnInit, OnDestroy {
    form: FormGroup;
    id?: number;

    positions = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];

    constructor(private route: ActivatedRoute, private fb: FormBuilder, private svc: TeamsService, private toast: ToastService, public router: Router, private renderer: Renderer2) {
        this.form = this.fb.group({ name: ['', Validators.required], acronym: [''], budget: [0, Validators.min(0)], players: this.fb.array([]) });
    }

    get players(): FormArray { return this.form.get('players') as FormArray; }

    addPlayer(name = '', position = '', id?: number) {
        const group = this.fb.group({ id: [id || null], name: [name, Validators.required], position: [position, Validators.required] });
        this.players.push(group);
    }

    removePlayer(index: number) { this.players.removeAt(index); }

    ngOnInit() {
        this.toast.showError("test "    );
        try { this.renderer.addClass(document.body, 'no-scroll'); } catch (e) {}
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) { this.toast.showError('Equipe introuvable'); this.router.navigateByUrl('/teams'); return; }
        this.id = id;
        this.svc.get(id).subscribe({ next: (t:any) => {
                this.form.patchValue({ name: t.name, acronym: t.acronym, budget: t.budget });
                try {
                    this.players.clear();
                    if (Array.isArray(t.players)) {
                        t.players.forEach((p: any) => this.addPlayer(p.name || '', p.position || '', p.id));
                    }
                } catch (e) { }
            }, error: (err: HttpErrorResponse) => {
                const msg = this.parseBackendError(err) || 'Impossible de charger l\'équipe';
                this.toast.showError(msg);
                this.router.navigateByUrl('/teams');
            } });
    }

    save() {
        if (!this.id) return;
        if (this.form.invalid) { this.toast.showError('Formulaire invalide'); return; }
        this.svc.update(this.id, this.form.value).subscribe({ next: () => { this.toast.showSuccess('Équipe mise à jour'); this.router.navigateByUrl('/teams'); }, error: (err: HttpErrorResponse) => {
                const payload = err?.error ?? err;
                const result = this.applyBackendErrorsToForm(payload, this.form);
                if (result.handled) {
                    this.toast.showError(result.summary || 'Erreur de validation');
                    return;
                }
                const msg = this.parseBackendError(err) || 'Erreur mise à jour';
                this.toast.showError(msg);
            } });
    }

    navigateBack() { this.router.navigateByUrl('/teams'); }

    ngOnDestroy() {
        try { this.renderer.removeClass(document.body, 'no-scroll'); } catch (e) {}
    }

    private parseBackendError(err: HttpErrorResponse): string | null {
        if (!err) return null as any;
        if (err.error && typeof err.error === 'string') return err.error;
        if (err.error && typeof err.error === 'object') {
            if (err.error.message) return err.error.message;
            if (err.error.errors && Array.isArray(err.error.errors) && err.error.errors.length) {
                return err.error.errors.map((e: any) => e.defaultMessage || e.message || JSON.stringify(e)).join('; ');
            }
        }
        return err.statusText || null;
    }

    private applyBackendErrorsToForm(payload: any, form: FormGroup): { handled: boolean; summary?: string } {
        if (!payload || typeof payload !== 'object') return { handled: false };
        if (payload.errors && typeof payload.errors === 'object') {
            Object.keys(payload.errors).forEach(field => {
                const control = form.get(field);
                const messages = payload.errors[field];
                if (control && Array.isArray(messages) && messages.length) {
                    control.setErrors({ backend: messages.join('; ') });
                    control.markAsTouched();
                }
            });
            const summary = payload.message || 'Erreur de validation';
            return { handled: true, summary };
        }

        if (Array.isArray(payload.fieldErrors)) {
            payload.fieldErrors.forEach((fe: any) => {
                const control = form.get(fe.field);
                if (control) {
                    control.setErrors({ backend: fe.defaultMessage || fe.message });
                    control.markAsTouched();
                }
            });
            const summary = payload.message || 'Erreur de validation';
            return { handled: true, summary };
        }

        return { handled: false };
    }
}
