import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { Page } from '../models/page.model';

export interface UserDto {
  id?: number;
  username: string;
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = '/api/users';
  constructor(private http: HttpClient) {}

  // reactive subjects for components
  private _usersPage = new BehaviorSubject<Page<UserDto> | null>(null);
  usersPage$ = this._usersPage.asObservable();
  users$ = this.usersPage$.pipe(map(p => p?.content || []));

  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();

  private lastParams = { page: 0, size: 10, sort: 'username,asc', q: undefined as string | undefined };

  // original API access method (returns observable) — kept for compatibility
  list(page: number = 0, size: number = 10, sort: string = 'username,asc', q?: string): Observable<any> {
    this.lastParams = { page, size, sort, q };
    this._loading.next(true);

    let httpParams = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);
    if (q) { httpParams = httpParams.set('q', q); }

    return this.http.get<any>(this.base, { params: httpParams }).pipe(
      tap(res => {
        // update BehaviorSubject with a page-shaped object
        if (Array.isArray(res)) {
          const pageObj: Page<UserDto> = { content: res, totalElements: res.length, totalPages: 1, number: page, size } as any;
          this._usersPage.next(pageObj);
        } else {
          this._usersPage.next(res as Page<UserDto>);
        }
      }),
      catchError(err => {
        console.error('Failed to list users', err);
        const empty: Page<UserDto> = { content: [], totalElements: 0, totalPages: 0, number: page, size } as Page<UserDto>;
        this._usersPage.next(empty);
        return of(empty);
      }),
      finalize(() => this._loading.next(false))
    );
  }

  // load & push result to BehaviorSubject (useful for components that subscribe to users$)
  load(page: number = 0, size: number = 10, sort: string = 'username,asc', q?: string): void {
    this.lastParams = { page, size, sort, q };
    this._loading.next(true);

    let httpParams = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);
    if (q) { httpParams = httpParams.set('q', q); }

    this.http.get<any>(this.base, { params: httpParams }).pipe(
      map((p: Page<any>) => ({ ...p, content: (p.content || []) } as Page<UserDto>)),
      tap(p => this._usersPage.next(p)),
      catchError(err => {
        console.error('Failed to load users', err);
        const empty: Page<UserDto> = { content: [], totalElements: 0, totalPages: 0, number: page, size } as Page<UserDto>;
        this._usersPage.next(empty);
        return of(empty);
      }),
      finalize(() => this._loading.next(false))
    ).subscribe();
  }

  refresh(): void {
    const p = this.lastParams;
    this.load(p.page, p.size, p.sort, p.q);
  }

  get(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.base}/${id}`);
  }

  create(dto: UserDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.base, dto).pipe(
      tap(() => this.refresh())
    );
  }

  update(id: number, dto: UserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/${id}`, dto).pipe(
      tap(() => this.refresh())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.refresh())
    );
  }

}
