/// <reference types="jasmine" />
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent, ToastService } from '../../shared';

class FakeAuth {
  loginSubject = new Subject<any>();
  login(_username: string, _password: string) {
    return this.loginSubject.asObservable();
  }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let fakeAuth: FakeAuth;

  beforeEach(async () => {
    fakeAuth = new FakeAuth();

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, CommonModule, LoaderComponent],
      providers: [
        { provide: AuthService, useValue: fakeAuth },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not submit when form invalid', () => {
    component.loginForm.setValue({ username: '', password: '' });
    spyOn(fakeAuth, 'login').and.callThrough();

    component.login();

    expect(component.loginForm.invalid).toBeTrue();
    expect((fakeAuth as any).login).not.toHaveBeenCalled();
  });

  it('should set isSubmitting while login in progress and clear after response', fakeAsync(() => {
    component.loginForm.setValue({ username: 'user', password: 'longpassword' });
    const spy = spyOn(fakeAuth, 'login').and.callThrough();

    component.login();
    // after calling login(), the Subject hasn't emitted yet
    expect(component.isSubmitting).toBeTrue();
    expect(spy).toHaveBeenCalled();

    // simulate server response
    fakeAuth.loginSubject.next({ token: 'abc' });
    fakeAuth.loginSubject.complete();
    tick();

    expect(component.isSubmitting).toBeFalse();
  }));
});
