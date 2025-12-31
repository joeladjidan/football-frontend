// typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ToastComponent } from './toast.component';
import {ToastService} from "./toast.service";

describe('ToastComponent', () => {
    let comp: ToastComponent;
    let fixture: ComponentFixture<ToastComponent>;
    let svc: any;
    let messages$: Subject<any>;

    beforeEach(async () => {
        messages$ = new Subject<any>();
        svc = {
            messages$: messages$,
            showSuccess: jasmine.createSpy('showSuccess'),
            showError: jasmine.createSpy('showError'),
            showInfo: jasmine.createSpy('showInfo')
        };

        await TestBed.configureTestingModule({
            imports: [ToastComponent], // composant standalone importé
            providers: [
                { provide: ToastService, useValue: svc }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ToastComponent);
        comp = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should remove a toast after its TTL expires', (done) => {
        const mockMessage = { id: 1, type: 'success', text: 'hi', ttl: 500 };
        messages$.next(mockMessage);

        fixture.detectChanges();

        setTimeout(() => {
            const toasts = fixture.nativeElement.querySelectorAll('.toast');
            expect(toasts.length).toBe(0);
            done();
        }, 600);
    });

    it('should remove a toast when the close button is clicked', () => {
        const mockMessage = { id: 1, type: 'success', text: 'hi' };
        messages$.next(mockMessage);

        fixture.detectChanges();

        const closeButton = fixture.nativeElement.querySelector('.toast .close');
        closeButton.click();

        fixture.detectChanges();

        const toasts = fixture.nativeElement.querySelectorAll('.toast');
        expect(toasts.length).toBe(0);
    });

    it('should display multiple toasts when multiple messages are emitted', () => {
        const messages = [
            { id: 1, type: 'success', text: 'Toast 1' },
            { id: 2, type: 'error', text: 'Toast 2' },
            { id: 3, type: 'info', text: 'Toast 3' }
        ];
        messages.forEach(msg => messages$.next(msg));

        fixture.detectChanges();

        const toasts = fixture.nativeElement.querySelectorAll('.toast');
        expect(toasts.length).toBe(3);
        expect(toasts[0].textContent).toContain('Toast 1');
        expect(toasts[1].textContent).toContain('Toast 2');
        expect(toasts[2].textContent).toContain('Toast 3');
    });

    it('should not display a toast if an invalid message is emitted', () => {
        const invalidMessage = { id: 1, type: 'unknown', text: 'Invalid' };
        messages$.next(invalidMessage);

        fixture.detectChanges();

        const toasts = fixture.nativeElement.querySelectorAll('.toast');
        expect(toasts.length).toBe(0);
    });

});
