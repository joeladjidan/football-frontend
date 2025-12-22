import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TeamsListComponent } from './teams-list.component';
import { TeamsService } from '../../services/teams.service';
import { ToastService } from '../../shared';
import { of, throwError } from 'rxjs';

class MockTeamsService {
  delete = jasmine.createSpy('delete').and.returnValue(of(undefined));
  load = jasmine.createSpy('load');
  teamsPage$ = of({ totalPages: 1, content: [] });
  teams$ = of([]);
  loading$ = of(false);
}

class MockToast { showSuccess = jasmine.createSpy('showSuccess'); showError = jasmine.createSpy('showError'); }

describe('TeamsListComponent', () => {
  let comp: TeamsListComponent;
  let fixture: ComponentFixture<TeamsListComponent>;
  let svc: MockTeamsService;
  let toast: MockToast;

  beforeEach(async () => {
    svc = new MockTeamsService() as any;
    toast = new MockToast() as any;
    await TestBed.configureTestingModule({ imports: [TeamsListComponent], providers: [ { provide: TeamsService, useValue: svc }, { provide: ToastService, useValue: toast } ] }).compileComponents();
    fixture = TestBed.createComponent(TeamsListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('confirmDelete should call service.delete and close modal on success', fakeAsync(() => {
    comp.selectedTeamsToDelete = { id: 123 as any, name: 'T' } as any;
    comp.modalVisible = true;
    comp.confirmDelete();
    tick();
    expect(svc.delete).toHaveBeenCalledWith(123 as any);
    expect(comp.modalVisible).toBeFalse();
    expect((toast.showSuccess as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  }));

  it('confirmDelete should display error and close modal on failure', fakeAsync(() => {
    (svc.delete as any).and.returnValue(throwError(() => ({ error: { message: 'oops' } })));
    comp.selectedTeamsToDelete = { id: 321 as any, name: 'X' } as any;
    comp.modalVisible = true;
    comp.confirmDelete();
    tick();
    expect(svc.delete).toHaveBeenCalledWith(321 as any);
    expect(comp.modalVisible).toBeFalse();
    expect((toast.showError as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  }));
});

