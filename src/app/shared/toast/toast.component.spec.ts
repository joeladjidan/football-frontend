import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

describe('ToastComponent', () => {
  let comp: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let svc: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    comp = fixture.componentInstance;
    svc = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should display a toast when service emits', (done) => {
    svc.messages$.subscribe(m => {
      fixture.detectChanges();
      expect(comp.messages.length).toBeGreaterThan(0);
      done();
    });
    svc.show('hi');
  });
});

