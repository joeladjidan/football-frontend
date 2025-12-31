// typescript
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { ToastrService, ActiveToast } from 'ngx-toastr';

/**
 * Interface representing a toast message.
 */
export interface ToastMessage {
  id?: number; // Unique identifier for the toast message
  type?: 'success' | 'error' | 'info' | 'warning'; // Type of the toast message
  text: string; // The message text to display
  duration?: number; // Duration for which the toast is displayed
  action?: () => void; // Optional action to execute on user interaction
  actionLabel?: string; // Label for the action button (if any)
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private subject = new ReplaySubject<ToastMessage>(10); // ReplaySubject to store the last 10 messages
  public messages$: Observable<ToastMessage> = this.subject.asObservable(); // Observable for toast messages
  private idSeq = 1; // Sequence generator for unique IDs
  private defaultDuration = 5000; // Default duration for toast messages

  /**
   * Constructor to inject the ToastrService for visual toast display.
   * @param toastr - The ToastrService instance.
   */
  constructor(private toastr: ToastrService) {}

  /**
   * Displays a toast message with the specified text, type, duration, and action.
   * @param text - The message text.
   * @param type - The type of the toast message (default: 'info').
   * @param duration - The duration for which the toast is displayed.
   * @param action - Optional action to execute on user interaction.
   * @returns The displayed toast message.
   */
  show(text: string, type: ToastMessage['type'] = 'info', duration?: number, action?: () => void): ToastMessage {
    return this.showWithOptions({ text, type, duration, action });
  }

  /**
   * Displays a toast message with options or a simple string.
   * @param opts - The options for the toast message or a simple string.
   * @returns The displayed toast message.
   */
  showWithOptions(opts: Partial<ToastMessage> | string): ToastMessage {
    const base: Partial<ToastMessage> = typeof opts === 'string' ? { text: opts } : { ...opts };

    const msg: ToastMessage = {
      id: base.id ?? this.idSeq++,
      text: base.text ?? '',
      type: base.type ?? 'info',
      duration: base.duration ?? this.defaultDuration,
      action: base.action,
      actionLabel: base.actionLabel
    };

    // Emit the message for the ToastComponent to handle
    this.subject.next(msg);

    // Build options for ngx-toastr
    const toastrOpts: any = {
      timeOut: msg.duration,
      closeButton: !!msg.action || true,
      tapToDismiss: true,
      enableHtml: false,
      progressBar: false
    };

    let active: ActiveToast<any> | undefined;
    try {
      switch (msg.type) {
        case 'success':
          active = this.toastr.success(msg.text, undefined, toastrOpts);
          break;
        case 'error':
          active = this.toastr.error(msg.text, undefined, toastrOpts);
          break;
        case 'warning':
          active = this.toastr.warning(msg.text, undefined, toastrOpts);
          break;
        default:
          active = this.toastr.info(msg.text, undefined, toastrOpts);
      }

      // Attach click event if an action is provided
      if (msg.action && active && active.onTap) {
        const sub = active.onTap.subscribe(() => {
          try { msg.action && msg.action(); } catch (e) { /* noop */ }
          sub.unsubscribe();
        });
      }
    } catch (e) {
      // Fallback to emitting via messages$ if ngx-toastr fails
    }

    return msg;
  }

  /**
   * Displays a success toast message.
   * @param text - The message text or a ToastMessage object.
   * @param duration - The duration for which the toast is displayed.
   * @param action - Optional action to execute on user interaction.
   * @returns The displayed toast message.
   */
  showSuccess(text: string | ToastMessage, duration?: number, action?: () => void): ToastMessage {
    if (typeof text === 'string') return this.showWithOptions({ text, type: 'success', duration, action });
    return this.showWithOptions({ ...text, type: text.type ?? 'success', duration: text.duration ?? duration });
  }

  /**
   * Displays an error toast message.
   * @param text - The message text or a ToastMessage object.
   * @param duration - The duration for which the toast is displayed.
   * @param action - Optional action to execute on user interaction.
   * @returns The displayed toast message.
   */
  showError(text: string | ToastMessage, duration?: number, action?: () => void): ToastMessage {
    if (typeof text === 'string') return this.showWithOptions({ text, type: 'error', duration, action });
    return this.showWithOptions({ ...text, type: text.type ?? 'error', duration: text.duration ?? duration });
  }

  /**
   * Displays an info toast message.
   * @param text - The message text or a ToastMessage object.
   * @param duration - The duration for which the toast is displayed.
   * @param action - Optional action to execute on user interaction.
   * @returns The displayed toast message.
   */
  showInfo(text: string | ToastMessage, duration?: number, action?: () => void): ToastMessage {
    if (typeof text === 'string') return this.showWithOptions({ text, type: 'info', duration, action });
    return this.showWithOptions({ ...text, type: text.type ?? 'info', duration: text.duration ?? duration });
  }

  /**
   * Displays a warning toast message.
   * @param text - The message text or a ToastMessage object.
   * @param duration - The duration for which the toast is displayed.
   * @param action - Optional action to execute on user interaction.
   * @returns The displayed toast message.
   */
  showWarning(text: string | ToastMessage, duration?: number, action?: () => void): ToastMessage {
    if (typeof text === 'string') return this.showWithOptions({ text, type: 'warning', duration, action });
    return this.showWithOptions({ ...text, type: text.type ?? 'warning', duration: text.duration ?? duration });
  }

  /**
   * Clears all toast messages.
   */
  clear() {
    // Implementation: Reset the ReplaySubject if needed
    // Note: ReplaySubject does not have a direct complete method; recreate it instead
    this.subject = new ReplaySubject<ToastMessage>(10);
    this.messages$ = this.subject.asObservable();
  }
}
