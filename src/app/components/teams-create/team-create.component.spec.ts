import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TeamCreateComponent } from './team-create.component';
import { TeamsService } from '../../services/teams.service';
import { ToastService } from '../../shared';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

describe('TeamCreateComponent', () => {
  let fixture: ComponentFixture<TeamCreateComponent>;
  let component: TeamCreateComponent;
  let svcMock: any;
  let toastMock: any;
  let toastrMock: any;
  let routerMock: any;

  function setup() {
    svcMock = jasmine.createSpyObj('TeamsService', ['create']);
    toastMock = jasmine.createSpyObj('ToastService', ['showWithOptions']);
    toastrMock = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    routerMock = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: TeamsService, useValue: svcMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    fixture = TestBed.createComponent(TeamCreateComponent as any);
    component = fixture.componentInstance as TeamCreateComponent;
  }

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('addPlayer should add a player group', () => {
    setup();
    expect(component.players.length).toBe(0);
    component.addPlayer();
    expect(component.players.length).toBe(1);
  });

  it('removePlayer should remove a player group', () => {
    setup();
    component.addPlayer();
    component.addPlayer();
    expect(component.players.length).toBe(2);
    component.removePlayer(0);
    expect(component.players.length).toBe(1);
  });

  it('submit should show validation toast when form invalid', () => {
    setup();
    // form initially invalid (name/acronym required)
    component.submit();
    expect(toastMock.showWithOptions).toHaveBeenCalled();
    expect(svcMock.create).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('submit should call create and navigate on success', fakeAsync(() => {
    setup();
    svcMock.create.and.returnValue(of({}));
    // fill valid form
    component.form.controls['name'].setValue('Les Aiglons');
    component.form.controls['acronym'].setValue('OGCN');
    component.form.controls['budget'].setValue(1000000);
    component.addPlayer();
    component.players.at(0).patchValue({ name: 'Player 1', position: 'Attaquant' });

    component.submit();
    expect(component.isSubmitting).toBeTrue();
    // flush observable
    tick();
    expect(svcMock.create).toHaveBeenCalled();
    expect(toastMock.showWithOptions).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'success' }));
    expect(component.isSubmitting).toBeFalse();
    // advance timeout for navigation
    tick(200);
    expect(routerMock.navigate).toHaveBeenCalled();
  }));

  it('submit should handle create error and show toast', fakeAsync(() => {
    setup();
    svcMock.create.and.returnValue(throwError(() => ({ error: { message: 'bad' } } )));
    component.form.controls['name'].setValue('Les Aiglons');
    component.form.controls['acronym'].setValue('OGCN');
    component.form.controls['budget'].setValue(1000000);
    component.submit();
    tick();
    expect(component.isSubmitting).toBeFalse();
    expect(toastMock.showWithOptions).toHaveBeenCalled();
  }));
});
