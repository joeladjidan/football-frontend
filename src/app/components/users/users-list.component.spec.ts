import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UsersListComponent } from './users-list.component';
import { ChangeDetectorRef, NgZone } from '@angular/core';

describe('UsersListComponent', () => {
  let fixture: ComponentFixture<UsersListComponent>;
  let component: UsersListComponent;
  let svcMock: any;
  let toastMock: any;
  let routerMock: any;
  let cdMock: any;
  let ngZoneMock: any;

  function setup() {
    svcMock = jasmine.createSpyObj('UsersService', ['list', 'delete']);
    toastMock = jasmine.createSpyObj('ToastService', ['showError', 'showSuccess']);
    routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
    cdMock = { detectChanges: jasmine.createSpy('detectChanges') } as any;
    ngZoneMock = { run: (fn: any) => fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: 'UsersService', useValue: svcMock },
        { provide: 'ToastService', useValue: toastMock },
        { provide: 'Router', useValue: routerMock },
        { provide: ChangeDetectorRef, useValue: cdMock },
        { provide: NgZone, useValue: ngZoneMock }
      ]
    });

    fixture = TestBed.createComponent(UsersListComponent as any);
    component = fixture.componentInstance as UsersListComponent;
  }

  it('should create and load on init', fakeAsync(() => {
    setup();
    svcMock.list.and.returnValue(of([]));
    component.ngOnInit();
    tick();
    expect(component).toBeTruthy();
    expect(svcMock.list).toHaveBeenCalled();
    expect(component.usersDisplayed).toEqual([]);
  }));

  it('load handles array response', fakeAsync(() => {
    setup();
    svcMock.list.and.returnValue(of([{ id:1, username: 'a' }]));
    component.load();
    tick();
    expect(component.usersDisplayed.length).toBe(1);
    expect(component.totalPages).toBe(1);
  }));

  it('load handles paged response', fakeAsync(() => {
    setup();
    svcMock.list.and.returnValue(of({ content: [{ id:2 }], totalPages: 3 }));
    component.load();
    tick();
    expect(component.usersDisplayed.length).toBe(1);
    expect(component.totalPages).toBe(3);
    expect(component.pageButtons.length).toBe(3);
  }));

  it('load handles 401 error by navigating to login', fakeAsync(() => {
    setup();
    svcMock.list.and.returnValue(throwError(() => ({ status: 401 })));
    component.load();
    tick();
    expect(toastMock.showError).toHaveBeenCalledWith('Session expirée, veuillez vous reconnecter');
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/login');
  }));

  it('prevPage and nextPage navigate pages and call load', () => {
    setup();
    spyOn(component, 'load');
    component.page = 1;
    component.totalPages = 3;
    component.prevPage();
    expect(component.page).toBe(0);
    expect(component.load).toHaveBeenCalled();
    component.page = 0;
    component.nextPage();
    expect(component.page).toBe(1);
  });

  it('onSizeChange debounces and calls load', fakeAsync(() => {
    setup();
    spyOn(component, 'load');
    component.size = 20;
    component.onSizeChange();
    // before timeout, load not called
    tick(200);
    expect(component.load).not.toHaveBeenCalled();
    tick(100);
    expect(component.load).toHaveBeenCalled();
  }));

  it('jumpToPage validates input and calls load', () => {
    setup();
    spyOn(component, 'load');
    component.totalPages = 5;
    component.jumpPage = null;
    component.jumpToPage();
    expect(toastMock.showError).toHaveBeenCalledWith('Veuillez saisir un numéro de page');
    component.jumpPage = 10;
    component.jumpToPage();
    expect(toastMock.showError).toHaveBeenCalledWith('Numéro de page invalide');
    component.jumpPage = 3;
    component.jumpToPage();
    expect(component.page).toBe(2);
    expect(component.load).toHaveBeenCalled();
  });

  it('confirmDelete calls delete and reloads', fakeAsync(() => {
    setup();
    svcMock.delete = jasmine.createSpy('delete').and.returnValue(of({}));
    spyOn(component, 'load');
    component.selectedUserToDelete = { id: 5 } as any;
    component.confirmDelete();
    tick();
    expect(svcMock.delete).toHaveBeenCalledWith(5);
    expect(toastMock.showSuccess).toHaveBeenCalledWith('Utilisateur supprimé');
    expect(component.modalVisible).toBeFalse();
    expect(component.load).toHaveBeenCalled();
  }));

  it('formatRoles returns expected string', () => {
    setup();
    expect(component.formatRoles(['A','B'])).toBe('A, B');
    expect(component.formatRoles('X')).toBe('X');
    expect(component.formatRoles(null)).toBe('');
  });
});
