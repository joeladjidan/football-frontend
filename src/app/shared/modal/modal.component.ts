import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() title = '';
  // contrôle de visibilité (peut être lié par ngModel / [(visible)])
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  // émis quand l'utilisateur confirme
  @Output() confirm = new EventEmitter<any>();

  // labels / options
  @Input() confirmLabel = 'Confirmer';
  @Input() cancelLabel = 'Fermer';
  @Input() showCancel = true;
  @Input() closeOnBackdrop = true;

  @ViewChild('dialog', { static: false }) dialogRef?: ElementRef<HTMLElement>;
  // read the native element for focus control (app-button is a component)
  @ViewChild('confirmButton', { static: false, read: ElementRef }) confirmButton?: ElementRef<HTMLElement>;

  private previouslyFocused: Element | null = null;
  private keyHandler = (e: KeyboardEvent) => this.onKeydown(e);

  // payload stocké si open(payload) est utilisé
  private _confirmPayload: any = undefined;

  // track DOM move
  private _movedToBody = false;

  constructor(private _host: ElementRef, private _renderer: Renderer2) {}

  // request to change visibility; emits event for parent to update its state
  close() {
    this.visible = false;
    try { this.visibleChange.emit(false); } catch (e) {}
    this.restoreFocus();
  }

  // programmatic open with optional payload
  open(payload?: any) {
    try {
      this._confirmPayload = payload;
      this.previouslyFocused = document.activeElement;
      this.visible = true;
      try { this.visibleChange.emit(true); } catch (e) {}
      // ensure element is attached to body before focus handling
      try { this._ensureAttachedToBody(); } catch (e) {}
      // call open lifecycle work
      this.onOpen();
    } catch (e) { }
  }

  ngAfterViewInit() {
    // attempt to attach to body so modal is outside stacking contexts
    try { this._ensureAttachedToBody(); } catch (e) {}
  }

  private _ensureAttachedToBody() {
    try {
      if (!this._host || !this._host.nativeElement) return;
      const native = this._host.nativeElement as HTMLElement;
      if (native.parentNode !== document.body) {
        // move using renderer to keep Angular happy
        try {
          this._renderer.appendChild(document.body, native);
        } catch (e) {
          // fallback to direct DOM append
          try { document.body.appendChild(native); } catch (err) { }
        }
        this._movedToBody = true;
      }
    } catch (e) { }
  }

  // backdrop click handler
  backdropClick(ev?: Event) {
    try {
      // only close when the backdrop itself was clicked (not a child) and option allows it
      if (!this.closeOnBackdrop) return;
      if (ev && ev.target !== ev.currentTarget) return;
    } catch (e) {}
    this.close();
  }

  // public helper to emit confirm with optional payload
  notifyConfirm(payload?: any) {
    try {
      const p = payload !== undefined ? payload : this._confirmPayload;
      // emit then close
      this.confirm.emit(p);
      this.close();
    } catch (e) { console.debug('notifyConfirm failed', e); }
  }

  // called by template when confirm button clicked
  onConfirmClick() {
    this.notifyConfirm(this._confirmPayload);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']) {
      const v = !!changes['visible'].currentValue;
      if (v) this.onOpen();
      else this.onClose();
    }
  }

  ngOnDestroy() {
    this.removeKeyListener();
    // if we moved the modal into body, remove it to avoid orphan nodes
    try {
      if (this._movedToBody && this._host && this._host.nativeElement && this._host.nativeElement.parentNode === document.body) {
        try { this._renderer.removeChild(document.body, this._host.nativeElement); } catch (e) { try { document.body.removeChild(this._host.nativeElement); } catch (err) {} }
        this._movedToBody = false;
      }
    } catch (e) {}
  }

  private onOpen() {
    try {
      // save focus and add listener
      if (!this.previouslyFocused) this.previouslyFocused = document.activeElement;
      this.addKeyListener();
      // set focus to confirm button (preferred) or first focusable
      setTimeout(() => {
        try {
          if (this.confirmButton && this.confirmButton.nativeElement) {
            (this.confirmButton.nativeElement as HTMLElement).focus();
          } else {
            this.focusFirst();
          }
        } catch (e) {}
      }, 0);
    } catch (e) { }
  }

  private onClose() {
    try {
      this.removeKeyListener();
      this.restoreFocus();
    } catch (e) { }
  }

  private addKeyListener() {
    try {
      document.addEventListener('keydown', this.keyHandler, true);
    } catch (e) {}
  }
  private removeKeyListener() {
    try {
      document.removeEventListener('keydown', this.keyHandler, true);
    } catch (e) {}
  }

  private onKeydown(e: KeyboardEvent) {
    try {
      if (!this.visible) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }
      if (e.key === 'Tab') {
        // trap focus within dialog
        const dlg = this.dialogRef?.nativeElement;
        if (!dlg) return;
        const focusable = this.getFocusableElements(dlg);
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !dlg.contains(active as Node)) {
            e.preventDefault();
            (last as HTMLElement).focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            (first as HTMLElement).focus();
          }
        }
      }
    } catch (err) { }
  }

  private getFocusableElements(root: HTMLElement): HTMLElement[] {
    const selector = `a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]`;
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length);
  }

  private focusFirst() {
    try {
      const dlg = this.dialogRef?.nativeElement;
      if (!dlg) return;
      const focusable = this.getFocusableElements(dlg);
      if (focusable.length) {
        (focusable[0] as HTMLElement).focus();
      } else {
        dlg.setAttribute('tabindex', '-1');
        dlg.focus();
      }
    } catch (e) { }
  }

  private restoreFocus() {
    try {
      const prev = this.previouslyFocused as HTMLElement | null;
      if (prev && typeof prev.focus === 'function') prev.focus();
      this.previouslyFocused = null;
    } catch (e) { }
  }
}
