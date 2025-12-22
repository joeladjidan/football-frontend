import { Component, OnInit, ChangeDetectorRef, NgZone, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService, ModalComponent, LoaderComponent } from '../../shared';
import { Router, ActivatedRoute } from '@angular/router';
import { Team } from '../../models/team.model';
import { TeamsService } from '../../services/teams.service';
import { Subscription, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, LoaderComponent],
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.css']
})
export class TeamsListComponent implements OnInit, AfterViewInit, OnDestroy {
  // reactive streams from service
  teams$: Observable<Team[]>;
  loading$: Observable<boolean>;

  page = 0;
  size = 10;
  pageSizes = [5, 10, 20, 50];
  totalPages = 1;
  pageButtons: number[] = [];

  query: string | undefined;
  selectedTeamsToDelete: Team | null = null;

  // Jump-to-page input value (1-based)
  jumpPage: number | null = null;

  private _modalVisible = false;
  get modalVisible() { return this._modalVisible; }
  set modalVisible(v: boolean) {
    this._modalVisible = v;
    // when modal opens, the confirm button is created; attach native listener as fallback
    try {
      if (this._modalVisible) {
        setTimeout(() => this.attachConfirmBtnListener(), 0);
      } else {
        this.detachConfirmBtnListener();
      }
    } catch (e) {}
  }
  // flag to prevent duplicate confirm clicks
  deleting = false;

  @ViewChild('delModal', { static: false }) delModal?: ModalComponent;
  private _confirmBtnListener?: any;
  private modalConfirmSub?: Subscription | null = null;

  // timeout handle for debouncing size changes
  private sizeChangeTimeout: any;

  // --- Sorting state ---
  sortField: string = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  // subscription for queryParams so we can refresh when navigating back
  private qpSub?: Subscription;
  // subscription to teamsPage for pagination updates
  private teamsPageSub?: Subscription;

  // query subject for client-side filtering (and to trigger debounced re-filters)
  private query$ = new BehaviorSubject<string | undefined>(undefined);

  constructor(private svc: TeamsService, private toast: ToastService, private router: Router, private route: ActivatedRoute, private cd: ChangeDetectorRef, private ngZone: NgZone) {
    // we'll combine service teams$ with the local query$ to provide a filtered observable
    this.loading$ = this.svc.loading$;

    // combine latest teams list and query to produce displayed teams
    this.teams$ = combineLatest([this.svc.teams$, this.query$.pipe(debounceTime(200), distinctUntilChanged())]).pipe(
      map(([teams, q]) => {
        if (!q || q.trim() === '') return teams;
        const trimmed = q.trim().toLowerCase();
        const num = Number(trimmed);
        const isNumber = !isNaN(num) && trimmed !== '';
        return teams.filter(t => {
          const nameMatch = t.name?.toLowerCase().includes(trimmed);
          const acronymMatch = t.acronym?.toLowerCase().includes(trimmed);
          const budgetMatch = isNumber ? t.budget === num : String(t.budget).toLowerCase().includes(trimmed);
          return !!nameMatch || !!acronymMatch || !!budgetMatch;
        });
      })
    );

  }

  ngOnInit() {
    // restore page size from localStorage if present
    try {
      const saved = localStorage.getItem('teams_page_size');
      if (saved) {
        const n = parseInt(saved, 10);
        if (!isNaN(n) && n > 0) { this.size = n; }
      }
    } catch (e) { /* noop */ }

    // restore state from query params
    try {
      const qp = this.route.snapshot.queryParamMap;
      const p = qp.get('page');
      const s = qp.get('size');
      const sort = qp.get('sort');
      if (p != null) {
        const pn = parseInt(p, 10);
        if (!isNaN(pn) && pn >= 0) { this.page = pn; }
      }
      if (s != null) {
        const sn = parseInt(s, 10);
        if (!isNaN(sn) && sn > 0) { this.size = sn; }
      }
      if (sort) {
        const parts = sort.split(',');
        if (parts.length >= 1 && parts[0]) { this.sortField = parts[0]; }
        if (parts.length >= 2 && (parts[1] === 'asc' || parts[1] === 'desc')) { this.sortDir = parts[1] as 'asc' | 'desc'; }
      }
    } catch (e) { /* noop */ }

    // initial load
    this.load();

    // subscribe to teamsPage updates to update pagination controls
    try {
      this.teamsPageSub = this.svc.teamsPage$.subscribe(page => {
        try {
          this.ngZone.run(() => {
            if (!page) {
              this.totalPages = 1;
            } else {
              this.totalPages = Math.max(1, page.totalPages || 1);
            }
            this.pageButtons = Array.from({ length: this.totalPages }, (_, i) => i);
          });
        } catch (e) {
          if (!page) { this.totalPages = 1; }
          else { this.totalPages = Math.max(1, page.totalPages || 1); }
          this.pageButtons = Array.from({ length: this.totalPages }, (_, i) => i);
        }
      });
    } catch (e) { /* noop */ }

    // reload when query param 'r' changes
    try {
      this.qpSub = this.route.queryParams.subscribe(params => {
        if (params && params['r']) {
          this.load();
        }
      });
    } catch (e) { /* noop */ }
  }

  ngAfterViewInit() {
    // subscribe once to the modal confirm emitter if available
    try {
      const emitter: any = (this.delModal as any)?.confirm;
      if (emitter && typeof emitter.subscribe === 'function') {
        // avoid duplicate subscriptions
        try { this.modalConfirmSub?.unsubscribe(); } catch (e) {}
        this.modalConfirmSub = emitter.subscribe((payload: any) => {
          console.debug('[TeamsList] modal.confirm (global) emitted', payload);
          // prefer payload provided by the modal, fallback to the currently selected team
          this.confirmDelete(payload ?? this.selectedTeamsToDelete);
        });
      }
    } catch (e) { console.debug('[TeamsList] ngAfterViewInit subscribe failed', e); }
  }

  ngOnDestroy() {
    this.detachConfirmBtnListener();
    if (this.sizeChangeTimeout) { clearTimeout(this.sizeChangeTimeout); }
    if (this.qpSub) { this.qpSub.unsubscribe(); }
    if (this.teamsPageSub) { this.teamsPageSub.unsubscribe(); }
    try { this.modalConfirmSub?.unsubscribe(); } catch (e) {}
  }

  private parseErrorMessage(err: any): string {
    try {
      if (!err) return 'Erreur inconnue';
      if (err.error) {
        const body = err.error;
        if (typeof body === 'string') return body;
        if (body.message) return body.message;
        if (body.errors) {
          if (Array.isArray(body.errors)) {
            return body.errors.map((e: any) => e.defaultMessage || e.message || JSON.stringify(e)).join(' ; ');
          } else {
            return Object.entries(body.errors).map(([k, v]) => `${k}: ${v}`).join(' ; ');
          }
        }
        return JSON.stringify(body);
      }
      if (err.message) return err.message;
    } catch (e) { }
    return 'Erreur inattendue';
  }

  get sortParam(): string { return `${this.sortField},${this.sortDir}`; }

  private updateUrl() {
    try {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: this.page, size: this.size, sort: this.sortParam },
        replaceUrl: true
      });
    } catch (e) { /* noop */ }
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
    this.updateUrl();
    this.load();
  }

  // Reactive load: trigger the service request and use teams$ / loading$ in template
  load() {
    const sort = this.sortParam;
    // keep last query in the subject so client-side filtering is applied too
    this.query$.next(this.query);
    this.svc.load(this.page, this.size, sort, this.query);
    try { this.updateUrl(); } catch (e) { /* noop */ }
  }

  onSearch() { this.page = 0; this.load(); }

  askDelete(u: Team) {
    console.debug('[TeamsList] askDelete', u);
    this.selectedTeamsToDelete = u;
    // open modal programmatically with payload if modal reference exists
    try {
      if (this.delModal && typeof (this.delModal as any).open === 'function') {
        try { (this.delModal as any).open(u); return; } catch (e) { /* fallback below */ }
      }
    } catch (e) { /* noop */ }
    // fallback: show via bound visible property
    this.modalVisible = true;
  }

  cancelModal(event?: Event) {
    try { event?.stopPropagation(); } catch (e) {}
    console.debug('[TeamsList] cancelModal');
    this.modalVisible = false;
    this.selectedTeamsToDelete = null;
  }

  onModalConfirm(team?: any) {
    // central helper called by template to trigger the modal's confirm emission
    try {
      if (this.delModal && typeof this.delModal.notifyConfirm === 'function') {
        this.delModal.notifyConfirm(team);
      } else {
        // fallback: call confirmDelete directly
        this.confirmDelete(team);
      }
    } catch (e) { console.debug('[TeamsList] onModalConfirm error', e); }
  }

  confirmDelete(teamArg?: any) {
    console.debug('[TeamsList] confirmDelete called', { teamArg, deleting: this.deleting, selected: this.selectedTeamsToDelete });
    if (this.deleting) { console.debug('[TeamsList] already deleting, ignoring'); return; } // already in progress
    const u = teamArg || this.selectedTeamsToDelete;
    if (!u?.id) { console.debug('[TeamsList] no selected team to delete'); this.modalVisible = false; return; }
    this.deleting = true;
    console.debug('[TeamsList] calling svc.delete', u.id);
    this.svc.delete(u.id).subscribe({
      next: () => {
        console.debug('[TeamsList] delete success', u.id);
        this.toast.showSuccess('Équipe supprimée');
        this.modalVisible = false;
        this.deleting = false;
        this.selectedTeamsToDelete = null;
        this.load();
      },
      error: (err: any) => {
        console.debug('[TeamsList] delete error', err);
        this.toast.showError(this.parseErrorMessage(err) || 'Échec de la suppression');
        this.modalVisible = false;
        this.deleting = false;
        this.selectedTeamsToDelete = null;
      }
    });
  }

  prevPage() { if (this.page > 0) { this.page--; this.updateUrl(); this.load(); } }
  nextPage() { if (this.page + 1 < this.totalPages) { this.page++; this.updateUrl(); this.load(); } }

  onSizeChange() {
    this.page = 0;
    try { localStorage.setItem('teams_page_size', String(this.size)); } catch (e) { /* noop */ }
    if (this.sizeChangeTimeout) { clearTimeout(this.sizeChangeTimeout); }
    this.sizeChangeTimeout = setTimeout(() => { this.updateUrl(); this.load(); }, 250);
  }

  jumpToPage() {
    if (this.jumpPage == null) {
      this.toast.showError('Veuillez saisir un numéro de page');
      return;
    }
    const p = Math.floor(this.jumpPage) - 1;
    if (isNaN(p) || p < 0 || p >= this.totalPages) {
      this.toast.showError('Numéro de page invalide');
      return;
    }
    this.page = p;
    this.updateUrl();
    this.load();
  }

  private attachConfirmBtnListener() {
    try {
      const btnRef = (this.delModal as any)?.confirmButton as ElementRef | undefined;
      const native = btnRef && (btnRef as any).nativeElement ? (btnRef as any).nativeElement as HTMLElement : null;
      if (native && !this._confirmBtnListener) {
        this._confirmBtnListener = (e: Event) => {
          console.debug('[TeamsList] native confirmBtn clicked (fallback)');
          this.confirmDelete(this.selectedTeamsToDelete);
        };
        native.addEventListener('click', this._confirmBtnListener);
      }
    } catch (e) { }
  }

  private detachConfirmBtnListener() {
    try {
      const btnRef = (this.delModal as any)?.confirmButton as ElementRef | undefined;
      const native = btnRef && (btnRef as any).nativeElement ? (btnRef as any).nativeElement as HTMLElement : null;
      if (native && this._confirmBtnListener) {
        native.removeEventListener('click', this._confirmBtnListener);
        this._confirmBtnListener = undefined;
      }
    } catch (e) { }
  }
}
