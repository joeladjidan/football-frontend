import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { UserCreateComponent } from './user-create.component';
import { Router } from '@angular/router';

describe('UserCreateComponent', () => {
  let fixture: ComponentFixture<UserCreateComponent>;
  let component: UserCreateComponent;
  let svcMock: any;
  let toastMock: any;
  let routerMock: any;

  function setup() {
    svcMock = jasmine.createSpyObj('UsersService', ['create']);
    toastMock = jasmine.createSpyObj('ToastService', ['showWithOptions', 'showInfo', 'showSuccess', 'showError']);
    routerMock = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: 'UsersService', useValue: svcMock },
        { provide: 'ToastService', useValue: toastMock },
        { provide: Router, useValue: routerMock }
      ]
    }).overrideProvider('UsersService', { useValue: svcMock });

    fixture = TestBed.createComponent(UserCreateComponent as any);
    component = fixture.componentInstance as UserCreateComponent;
  }

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('submit should show validation toast when form invalid', () => {
    setup();
    component.form.controls['username'].setValue('');
    component.submit();
    expect(toastMock.showWithOptions).toHaveBeenCalled();
    expect(svcMock.create).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('submit should call create and navigate on success', fakeAsync(() => {
    setup();
    svcMock.create.and.returnValue(of({}));
    component.form.controls['username'].setValue('newuser');
    component.form.controls['roles'].setValue('ADMIN,USER');
    component.submit();
    expect(component.isSubmitting).toBeTrue();
    tick();
    expect(svcMock.create).toHaveBeenCalled();
    expect(toastMock.showSuccess).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/users');
    expect(component.isSubmitting).toBeFalse();
  }));

  it('submit should handle create error', fakeAsync(() => {
    setup();
    svcMock.create.and.returnValue(throwError(() => new Error('fail')));
    component.form.controls['username'].setValue('newuser');
    component.form.controls['roles'].setValue('ADMIN');
    component.submit();
    tick();
    expect(toastMock.showError).toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  }));

  it('cancel should navigate to /users with query param', () => {
    setup();
    component.cancel();
    expect(routerMock.navigate).toHaveBeenCalled();
  });
});
