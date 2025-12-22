import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../components/login';
import { ToastService } from '../shared';

function extractMessages(err: any): string[] {
  if (!err) return [];
  // If backend returns { message: '...', ... }
  if (typeof err.message === 'string') return [err.message];
  // If backend returns { message: ['a','b'] }
  if (Array.isArray(err.message)) return err.message.map(String);
  // If backend returns { errors: ['a','b'] } or { errors: { field: ['a'] } }
  if (err.errors) {
    if (Array.isArray(err.errors)) return err.errors.map(String);
    if (typeof err.errors === 'object') {
      const acc: string[] = [];
      Object.values(err.errors).forEach(v => {
        if (Array.isArray(v)) { v.forEach(x => acc.push(String(x))); }
        else acc.push(String(v));
      });
      return acc;
    }
  }
  // sometimes backend returns { messages: ['a','b'] }
  if (err.messages && Array.isArray(err.messages)) return err.messages.map(String);
  // fallback to stringified error
  if (typeof err === 'string') return [err];
  try { return [JSON.stringify(err)]; } catch { return ['Unexpected error']; }
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private toast: ToastService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    const handled = token ? next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })) : next.handle(req);
    return handled.pipe(
      tap(event => {
        // If it's an HttpResponse, check for messages in the body and show toasts
        if (event instanceof HttpResponse) {
          try {
            const body = event.body;
            if (body && typeof body === 'object') {
              // If response is a list payload (array) or a paged object with 'content',
              // avoid showing a toast unless an explicit message-like field is present.
              const hasExplicitMessageField = !!(
                body.message || body.messages || body.msg || body.info || body.detail || body.result || body.error || body.errors
              );
              if (!hasExplicitMessageField && (Array.isArray(body) || body.content)) {
                // It's a data payload without explicit message — do not show toast
                return;
              }
               // collect messages from multiple possible keys
               const msgs: Array<{ text: string, type?: 'success'|'info'|'error' }> = [];

               // errors (prefer error)
               if (body.error && typeof body.error === 'string') msgs.push({ text: body.error, type: 'error' });
               if (body.errors && Array.isArray(body.errors)) body.errors.forEach((e: any) => msgs.push({ text: String(e), type: 'error' }));

               // common message fields
               if (typeof body.message === 'string') msgs.push({ text: body.message, type: body.success === false ? 'error' : 'success' });
               if (Array.isArray(body.message)) body.message.forEach((m: any) => msgs.push({ text: String(m), type: 'success' }));
               if (Array.isArray(body.messages)) body.messages.forEach((m: any) => msgs.push({ text: String(m), type: 'success' }));
               if (typeof body.msg === 'string') msgs.push({ text: body.msg, type: body.success === false ? 'error' : 'success' });
               if (typeof body.detail === 'string') msgs.push({ text: body.detail, type: 'info' });
               if (typeof body.info === 'string') msgs.push({ text: body.info, type: 'info' });

               // explicit success flag with optional message
               if (body.success === true && typeof body.message === 'string') msgs.push({ text: body.message, type: 'success' });
               if (body.result && typeof body.result === 'string') msgs.push({ text: body.result, type: 'success' });

               // group messages by type and show a single toast per type
               if (msgs.length) {
                 const grouped: Record<string, string[]> = {};
                 msgs.forEach(m => {
                   const t = m.type || 'info';
                   if (!grouped[t]) grouped[t] = [];
                   grouped[t].push(m.text);
                 });
                 // show combined toasts
                 if (grouped['error']) this.toast.showError(grouped['error'].join(' \u2014 '));
                 if (grouped['success']) this.toast.showSuccess(grouped['success'].join(' \u2014 '));
                 if (grouped['info']) this.toast.show(grouped['info'].join(' \u2014 '), 'info');
               }
            }
          } catch (e) {
            // ignore any parsing issues
          }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.toast.showError('Erreur réseau : impossible de contacter le serveur');
        } else if (err.status === 403) {
          this.toast.showError('Accès refusé (403) — vous n\'avez pas les droits pour cette ressource');
        } else if (err.status === 401) {
          this.toast.showError('Non autorisé (401) — veuillez vous reconnecter');
          this.auth.logout();
        } else if (err.status >= 500) {
          this.toast.showError('Erreur serveur (' + err.status + ')');
        } else {
          // try to extract meaningful messages
          const msgs = extractMessages(err.error ?? err);
          if (msgs && msgs.length) {
            // group error messages into a single toast
            this.toast.showError(msgs.join(' \u2014 '));
          } else {
            this.toast.showError('Erreur HTTP ' + err.status);
          }
        }
        return throwError(() => err);
      })
    );
  }
}
