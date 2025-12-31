import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WelcomeComponent } from './welcome.component';

describe('WelcomeComponent', () => {
  let fixture: ComponentFixture<WelcomeComponent>;
  let component: WelcomeComponent;
  let authMock: any;
  let routerMock: any;

  beforeEach(() => {
    authMock = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [
        { provide: 'AuthService', useValue: authMock },
        { provide: 'Router', useValue: routerMock }
      ]
    });

    fixture = TestBed.createComponent(WelcomeComponent as any);
    component = fixture.componentInstance as WelcomeComponent;
  });

  afterEach(() => {
    // ensure body class is cleaned between tests
    try { document.body.classList.remove('no-scroll-home'); } catch (e) {}
  });

  it('should create', () => {
    authMock.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnInit navigates to /login when not logged in', () => {
    authMock.isLoggedIn.and.returnValue(false);
    component.ngOnInit();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(document.body.classList.contains('no-scroll-home')).toBeFalse();
  });

  it('ngOnInit adds no-scroll-home class when logged in', () => {
    authMock.isLoggedIn.and.returnValue(true);
    component.ngOnInit();
    expect(document.body.classList.contains('no-scroll-home')).toBeTrue();
  });

  it('ngOnDestroy unsubscribes and removes body class', () => {
    // prepare a mock subscription
    const unsubSpy = jasmine.createSpy('unsubscribe');
    (component as any).subs.push({ unsubscribe: unsubSpy });
    // add class to body to ensure removal
    document.body.classList.add('no-scroll-home');
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
    expect(document.body.classList.contains('no-scroll-home')).toBeFalse();
  });
});
