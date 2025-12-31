// typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent implements OnInit, OnDestroy {
  messages: ToastMessage[] = [];
  private sub?: Subscription;

  constructor(private svc: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub = this.svc.messages$.subscribe(msg => {
      // filtrer les types non reconnus pour rester conforme aux tests
      const validTypes = ['success', 'error', 'info', 'warning'];
      if (!msg || (msg.type && !validTypes.includes(msg.type))) return;

      // ajouter le message au tableau pour affichage
      this.messages.push(msg);
      this.cdr.markForCheck();

      // supporter à la fois `duration` (service) et `ttl` (tests existants)
      const duration = (msg.duration ?? (msg as any).ttl) ?? 5000;

      // retirer automatiquement après duration
      const tsub = timer(duration).subscribe(() => {
        this.remove(msg.id);
        tsub.unsubscribe();
      });
    });
  }

  remove(id?: number) {
    this.messages = this.messages.filter(m => m.id !== id);
    this.cdr.markForCheck();
  }

  action(msg: ToastMessage) {
    if (msg.action) msg.action();
    this.remove(msg.id);
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
