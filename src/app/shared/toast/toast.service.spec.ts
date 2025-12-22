import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should emit a message via messages$', (done) => {
    service.messages$.subscribe(m => {
      expect(m.text).toBe('hello');
      expect(m.type).toBe('info');
      done();
    });
    service.show('hello');
  });

  it('should accept showWithOptions with action and duration', (done) => {
    service.messages$.subscribe(m => {
      expect(m.actionLabel).toBe('Retry');
      expect(m.duration).toBe(1234);
      done();
    });
    service.showWithOptions({ text: 'oops', type: 'error', duration: 1234, actionLabel: 'Retry', action: () => {} });
  });
});

