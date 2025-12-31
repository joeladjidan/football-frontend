import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserEditComponent } from './user-edit.component';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

describe('UserEditComponent', () => {
  let fixture: ComponentFixture<UserEditComponent>;
  let component: UserEditComponent;

  const userMock = { id: 1, username: 'jdoe', roles: ['ADMIN'] } as any;

  let svcMock: any;
  let toastMock: any;
  let routerMock: any;

  function setup(routeId: string | null = '1') {
    svcMock = jasmine.createSpyObj('UsersService', ['get', 'update']);
    toastMock = jasmine.createSpyObj('ToastService', ['showError', 'showSuccess']);
    routerMock = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

    const activatedRoute: any = { snapshot: { paramMap: { get: (_: string) => routeId } } };

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        FormBuilder,
        { provide: 'UsersService', useValue: svcMock },
        { provide: 'ToastService', useValue: toastMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).overrideProvider('UsersService', { useValue: svcMock });

    fixture = TestBed.createComponent(UserEditComponent as any);
    component = fixture.componentInstance as UserEditComponent;
  }

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('ngOnInit should navigate away when id missing', () => {
    setup(null);
    // When initialized, component should call toast.showError and navigate
    component.ngOnInit();
    expect(toastMock.showError).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/users');
  });

  it('ngOnInit should load user and patch form', fakeAsync(() => {
    setup('1');
    svcMock.get.and.returnValue(of(userMock));
    component.ngOnInit();
    tick();
    expect(svcMock.get).toHaveBeenCalledWith(1);
    expect(component.form.value.username).toBe('jdoe');
    expect(component.form.value.roles).toContain('ADMIN');
  }));

  it('save should not call update when form invalid', () => {
    setup('1');
    svcMock.get.and.returnValue(of(userMock));
    component.ngOnInit();
    // make form invalid
    component.form.controls['username'].setValue('');
    component.save();
    expect(svcMock.update).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('save should call update and navigate on success', fakeAsync(() => {
    setup('1');
    svcMock.get.and.returnValue(of(userMock));
    svcMock.update.and.returnValue(of({}));
    component.ngOnInit();
    // valid form
    component.form.controls['username'].setValue('newname');
    component.form.controls['roles'].setValue('ADMIN,USER');
    component.save();
    expect(component.isSubmitting).toBeTrue();
    tick();
    expect(svcMock.update).toHaveBeenCalled();
    expect(toastMock.showSuccess).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/users');
    expect(component.isSubmitting).toBeFalse();
  }));

  it('save should handle update error', fakeAsync(() => {
    setup('1');
    svcMock.get.and.returnValue(of(userMock));
    svcMock.update.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    component.form.controls['username'].setValue('newname');
    component.form.controls['roles'].setValue('ADMIN');
    component.save();
    tick();
    expect(toastMock.showError).toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  }));
});
