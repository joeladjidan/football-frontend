import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { TeamRequest, Team } from '../models/team.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class TeamsService {
  constructor(private http: HttpClient) {}

  // BehaviorSubjects to hold current state for components (helps with OnPush/change detection)
  private _teamsPage = new BehaviorSubject<Page<Team> | null>(null);
  teamsPage$ = this._teamsPage.asObservable();

  // derived observable exposing only the list of teams
  teams$ = this.teamsPage$.pipe(map(p => p?.content || []));

  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();

  // remember last query params to allow easy refresh after mutations
  private lastParams = { page: 0, size: 10, sort: 'name,asc', query: undefined as string | undefined };

  private mapToTeam(raw: any): Team {
    // normalize players: support either array of objects or comma-separated string
    let players = undefined as any;
    if (raw.players) {
      if (Array.isArray(raw.players)) {
        players = raw.players.map((p: any) => ({ id: p.id, name: p.name, position: p.position }));
      } else if (typeof raw.players === 'string') {
        players = raw.players.split(',').map((s: string) => ({ name: s.trim(), position: '' }));
      }
    }
    return {
      id: Number(raw.id),
      name: raw.name,
      acronym: raw.acronym,
      budget: Number(raw.budget),
      players
    } as Team;
  }

  // Public method returning an Observable for list (used by components)
  list(page: number = 0, size: number = 10, sort: string = 'name,asc', query?: string): Observable<Page<Team> | Team[]> {
    this.lastParams = { page, size, sort, query };
    this._loading.next(true);

    let httpParams = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);

    if (query != null && query !== '') {
      httpParams = httpParams.set('q', query);
    }

    const options = { params: httpParams };
    return this.http.get<any>('/api/teams', options).pipe(
      map((p: any) => {
        if (Array.isArray(p)) return p.map((c: any) => this.mapToTeam(c));
        const mapped: Page<Team> = { ...p, content: (p.content || []).map((c: any) => this.mapToTeam(c)) };
        return mapped;
      }),
      tap((result: any) => {
        // update the BehaviorSubject so components using reactive streams are updated
        if (Array.isArray(result)) {
          const pageObj: Page<Team> = { content: result, totalElements: result.length, totalPages: 1, number: page, size } as any;
          this._teamsPage.next(pageObj);
        } else {
          this._teamsPage.next(result as Page<Team>);
        }
      }),
      catchError(err => {
        console.error('Failed to list teams', err);
        // push an empty page to keep subscribers consistent
        const empty: Page<Team> = { content: [], totalElements: 0, totalPages: 0, number: page, size } as Page<Team>;
        this._teamsPage.next(empty);
        return throwError(() => err);
      }),
      finalize(() => this._loading.next(false))
    );
  }

  // Load list and push the result into the BehaviorSubject so components can react (change detection friendly)
  load(page: number = 0, size: number = 10, sort: string = 'name,asc', query?: string): void {
    this.lastParams = { page, size, sort, query };
    this._loading.next(true);

    let httpParams = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);

    if (query != null && query !== '') {
      httpParams = httpParams.set('q', query);
    }

    const options = { params: httpParams };
    this.http.get<any>('/api/teams', options).pipe(
      map((p: Page<any>) => {
        const mapped: Page<Team> = { ...p, content: (p.content || []).map(c => this.mapToTeam(c)) };
        return mapped;
      }),
      tap(p => this._teamsPage.next(p)),
      catchError(err => {
        console.error('Failed to load teams', err);
        // push an empty page to keep subscribers consistent
        const empty: Page<Team> = { content: [], totalElements: 0, totalPages: 0, number: page, size } as Page<Team>;
        this._teamsPage.next(empty);
        return of(empty);
      }),
      finalize(() => this._loading.next(false))
    ).subscribe();
  }

  // convenience to refresh using last used params
  refresh(): void {
    const p = this.lastParams;
    this.load(p.page, p.size, p.sort, p.query);
  }

  get(id: number): Observable<Team> {
    return this.http.get<any>(`/api/teams/${id}`).pipe(
      map(raw => this.mapToTeam(raw))
    );
  }

  create(payload: TeamRequest): Observable<Team> {
    return this.http.post<Team>('/api/teams', payload).pipe(
      tap(() => this.refresh())
    );
  }

  update(id: number, payload: TeamRequest): Observable<Team> {
    return this.http.put<Team>(`/api/teams/${id}`, payload).pipe(
      tap(() => this.refresh())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/teams/${id}`).pipe(
      tap(() => this.refresh())
    );
  }
}
