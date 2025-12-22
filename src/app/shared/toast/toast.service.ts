import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

export interface ToastMessage { text: string; type?: 'info' | 'success' | 'error'; id?: number; duration?: number; action?: () => void; actionLabel?: string }

@Injectable({ providedIn: 'root' })
export class ToastService {
  // ReplaySubject so late subscribers (e.g. toast component) still receive recent messages
  private subject = new ReplaySubject<ToastMessage>(10);
  private idCounter = 0;

  get messages$(): Observable<ToastMessage> { return this.subject.asObservable(); }

  show(text: string, type: 'info'|'success'|'error' = 'info') {
    this.showWithOptions({ text, type });
  }

  showWithOptions(msg: { text: string; type?: 'info'|'success'|'error'; duration?: number; action?: () => void; actionLabel?: string }) {
    const full: ToastMessage = { text: msg.text, type: msg.type || 'info', id: ++this.idCounter, duration: msg.duration, action: msg.action, actionLabel: msg.actionLabel };
    this.subject.next(full);
  }

  showError(text: string) { this.showWithOptions({ text, type: 'error' }); }
  showSuccess(text: string) { this.showWithOptions({ text, type: 'success' }); }
}
