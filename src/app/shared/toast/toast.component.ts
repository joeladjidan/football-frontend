import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './toast.component.html',
  styles: [
    `.toast-wrapper { position: fixed; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 10000; display:flex; flex-direction:column; align-items:center; pointer-events:none }`,
    `.toast { pointer-events:auto; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; padding:0.6rem 1rem; border-radius:4px; color:#fff; min-width:220px; max-width:90vw; box-shadow: 0 6px 18px rgba(0,0,0,0.12); }`,
    `.icon { font-weight:bold; width:20px; text-align:center }`,
    `.text { flex:1 }`,
    `.action { background:transparent; border:1px solid rgba(255,255,255,0.2); color:#fff; padding:0.2rem 0.4rem; border-radius:3px }`,
    `.toast-info { background:#17a2b8 }`,
    `.toast-success { background:#28a745 }`,
    `.toast-error { background:#dc3545 }`,
    `@keyframes toastIn { from { transform: translateY(-8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`,
    `@keyframes toastOut { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-8px); opacity: 0 } }`,
    `.exiting { opacity:0 }
  `
  ]
})
export class ToastComponent {
  messages: Array<ToastMessage & { exiting?: boolean }> = [];
  sub?: Subscription;
  constructor(private svc: ToastService) {
    this.sub = this.svc.messages$.subscribe(m => {
      const msg = { ...m } as ToastMessage & { exiting?: boolean };
      this.messages.push(msg);
      const duration = m.duration ?? 4000;
      setTimeout(() => this.startExit(msg), duration);
    });
  }

  startExit(m: ToastMessage & { exiting?: boolean }) {
    m.exiting = true;
    setTimeout(() => { this.messages = this.messages.filter(x => x.id !== m.id); }, 300);
  }

  iconFor(type: string | undefined) {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '⚠';
      default: return 'ℹ';
    }
  }

  onAction(m: ToastMessage) {
    if (m.action) { m.action(); }
    this.startExit(m);
  }
}
