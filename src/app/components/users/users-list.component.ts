import { Component, OnInit, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService, UserDto } from '../../services/users.service';
import { ToastService, ModalComponent, ButtonComponent, LoaderComponent } from '../../shared';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent, ButtonComponent, LoaderComponent],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit, OnDestroy {
  // users currently displayed (page slice)
  usersDisplayed: UserDto[] = [];

  // sorting state
  sortField: string = 'username';
  sortDir: 'asc' | 'desc' = 'asc';

  get sortParam(): string { return `${this.sortField},${this.sortDir}`; }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.page = 0;
    this.load();
  }

  page = 0;
  size = 10;
  pageSizes = [5,10,20,50];
  totalPages = 1;
  pageButtons: number[] = [];

  query: string | undefined;

  isLoading = false;

  // Jump-to-page input value (1-based)
  jumpPage: number | null = null;

  modalVisible = false;
  selectedUserToDelete: UserDto | null = null;
  // timeout handle for debouncing size changes
  private sizeChangeTimeout: any;

  constructor(private svc: UsersService, private toast: ToastService, private router: Router, private cd: ChangeDetectorRef, private ngZone: NgZone) {}
  ngOnInit() {
    // Read saved page size first (if present) and then load immediately to avoid double-scheduling
    try {
      const saved = localStorage.getItem('users_page_size');
      if (saved) {
        const n = parseInt(saved, 10);
        if (!isNaN(n) && n > 0) { this.size = n; }
      }
    } catch (e) { /* noop */ }

    // load the first page synchronously
    this.load();
  }

  ngOnDestroy() {
    if (this.sizeChangeTimeout) { clearTimeout(this.sizeChangeTimeout); }
  }

  // Load users page from server
  load() {
    this.isLoading = true;
    const sort = this.sortParam;
    this.svc.list(this.page, this.size, sort, this.query)
      .pipe(finalize(() => {
        // ensure we clear loading inside angular zone
        try { this.ngZone.run(() => { this.isLoading = false; }); } catch (e) { this.isLoading = false; }
      }))
      .subscribe({
        next: (res: any) => {
          // assign values directly; HTTP runs inside zone, so change detection will normally run
          if (Array.isArray(res)) {
            this.usersDisplayed = res;
            this.totalPages = 1;
          } else if (res && res.content) {
            this.usersDisplayed = res.content;
            this.totalPages = Math.max(1, res.totalPages || 1);
          } else {
            this.usersDisplayed = [];
            this.totalPages = 1;
          }
          this.pageButtons = Array.from({ length: this.totalPages }, (_, i) => i);

          // Force a tick to ensure template updates immediately in all environments
          try {
            // small timeout lets Angular finish the current microtask and update view reliably
            setTimeout(() => { try { this.cd.detectChanges(); } catch (e) { /* noop */ } }, 0);
          } catch (e) { try { this.cd.detectChanges(); } catch (e2) { /* noop */ } }
        },
        error: (err) => {
          // handle errors and show toasts inside the zone
          try {
            this.ngZone.run(() => {
              if (err?.status === 401) {
                this.toast.showError('Session expirée, veuillez vous reconnecter');
                this.router.navigateByUrl('/login');
              } else if (err?.status === 403) {
                this.toast.showError("Accès refusé (403) — vous n'avez pas les droits pour cette ressource");
              } else {
                this.toast.showError('Impossible de charger les utilisateurs');
              }
            });
          } catch (e) {
            if (err?.status === 401) {
              this.toast.showError('Session expirée, veuillez vous reconnecter');
              this.router.navigateByUrl('/login');
            } else if (err?.status === 403) {
              this.toast.showError("Accès refusé (403) — vous n'avez pas les droits pour cette ressource");
            } else {
              this.toast.showError('Impossible de charger les utilisateurs');
            }
          }
        }
      });
  }

  onSearch() { this.page = 0; this.load(); }


  askDelete(u: UserDto) { this.selectedUserToDelete = u; this.modalVisible = true; }
  confirmDelete() { const u = this.selectedUserToDelete; if (!u?.id) { this.modalVisible=false; return; } this.svc.delete(u.id).subscribe({ next: () => { this.toast.showSuccess('Utilisateur supprimé'); this.modalVisible=false; this.load(); }, error: () => { this.toast.showError('Échec de la suppression'); this.modalVisible=false; } }); }

  prevPage() { if (this.page>0) { this.page--; this.load(); } }
  nextPage() { if (this.page+1 < this.totalPages) { this.page++; this.load(); } }

  // Handle page-size change: reset to first page and reload
  onSizeChange() {
    this.page = 0;
    // persist page size for next visits
    try { localStorage.setItem('users_page_size', String(this.size)); } catch (e) { /* noop */ }
    // debounce rapid changes
    if (this.sizeChangeTimeout) { clearTimeout(this.sizeChangeTimeout); }
    this.sizeChangeTimeout = setTimeout(() => { this.load(); }, 250);
  }

  // Jump to a specific page (1-based input)
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
    this.load();
  }

  formatRoles(r: any): string {
    if (!r) return '';
    if (Array.isArray(r)) return r.join(', ');
    return String(r);
  }
}
