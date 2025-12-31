import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TeamEditComponent } from './team-edit.component';
import { FormBuilder } from '@angular/forms';
import { TeamsService } from '../../services/teams.service';
import { ToastService } from '../../shared';
import { Router, ActivatedRoute } from '@angular/router';

describe('TeamEditComponent', () => {
  let fixture: ComponentFixture<TeamEditComponent>;
  let component: TeamEditComponent;
  let svcMock: any;
  let toastMock: any;
  let routerMock: any;
  let rendererMock: any;

  function setup(routeId: string | null = '1') {
    svcMock = jasmine.createSpyObj('TeamsService', ['get', 'update']);
    toastMock = jasmine.createSpyObj('ToastService', ['showError', 'showSuccess']);
    routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
    rendererMock = { addClass: jasmine.createSpy('addClass'), removeClass: jasmine.createSpy('removeClass') } as any;

    const activatedRoute: any = { snapshot: { paramMap: { get: (_: string) => routeId } } };

    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: TeamsService, useValue: svcMock },
        { provide: ToastService, useValue: toastMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: 'Renderer2', useValue: rendererMock }
      ]
    });

    // create component using TestBed (bypass strict typing)
    fixture = TestBed.createComponent(TeamEditComponent as any);
    component = fixture.componentInstance as TeamEditComponent;
    // replace renderer with our mock (component injects Renderer2 directly)
    (component as any).renderer = rendererMock;
  }

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('ngOnInit should navigate away when id missing', () => {
    setup(null);
    component.ngOnInit();
    expect(toastMock.showError).toHaveBeenCalledWith('Equipe introuvable');
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/teams');
  });

  it('ngOnInit should load team and populate form and players', fakeAsync(() => {
    setup('12');
    const team = { id: 12, name: 'OGC', acronym: 'OGC', budget: 1000, players: [{ id: 1, name: 'P1', position: 'Attaquant' }] };
    svcMock.get.and.returnValue(of(team));
    component.ngOnInit();
    tick();
    expect(svcMock.get).toHaveBeenCalledWith(12);
    expect(component.form.value.name).toBe('OGC');
    expect(component.players.length).toBe(1);
    expect(rendererMock.addClass).toHaveBeenCalled();
  }));

  it('save should return when id missing', () => {
    setup(null);
    // ensure no id
    component.id = undefined;
    component.save();
    expect(svcMock.update).not.toHaveBeenCalled();
  });

  it('save should show error when form invalid', () => {
    setup('1');
    component.id = 1;
    component.form.controls['name'].setValue('');
    component.save();
    expect(toastMock.showError).toHaveBeenCalledWith('Formulaire invalide');
    expect(svcMock.update).not.toHaveBeenCalled();
  });

  it('save should call update and navigate on success', fakeAsync(() => {
    setup('1');
    component.id = 1;
    svcMock.update.and.returnValue(of({}));
    component.form.controls['name'].setValue('TeamX');
    component.form.controls['acronym'].setValue('TX');
    component.form.controls['budget'].setValue(5000);
    component.save();
    tick();
    expect(svcMock.update).toHaveBeenCalled();
    expect(toastMock.showSuccess).toHaveBeenCalledWith('Équipe mise à jour');
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/teams');
  }));

  it('save should handle backend validation errors and set control errors', fakeAsync(() => {
    setup('1');
    component.id = 1;
    svcMock.update.and.returnValue(throwError(() => ({ error: { errors: { name: ['too short'] }, message: 'Invalid' } } )));
    component.form.controls['name'].setValue('T');
    component.form.controls['acronym'].setValue('T');
    component.form.controls['budget'].setValue(0);
    component.save();
    tick();
    // control should have backend error
    const errs = component.form.get('name')?.errors as any;
    expect(errs && errs.backend).toContain('too short');
    expect(toastMock.showError).toHaveBeenCalledWith('Invalid');
  }));

  it('parseBackendError should extract string message', () => {
    setup('1');
    const err: any = { error: 'simple error', statusText: 'Bad Request' };
    const res = (component as any).parseBackendError(err);
    expect(res).toBe('simple error');
  });
});
