import { ModalComponent } from './modal.component';
import { ElementRef } from '@angular/core';

describe('ModalComponent (a11y focus, unit)', () => {
  it('should focus the first focusable element when opened', (done) => {
    // créer des mocks pour ElementRef (host) et Renderer2
    const hostEl = document.createElement('div');
    const host = new ElementRef(hostEl);
    const rendererMock = {
      appendChild: (_parent: any, _child: any) => { try { (_parent as any).appendChild(_child); } catch(e){} },
      removeChild: (_parent: any, _child: any) => { try { (_parent as any).removeChild(_child); } catch(e){} }
    } as any;
    const comp = new ModalComponent(host, rendererMock);
    // créer un conteneur simulé qui contient un bouton focusable
    const dialog = document.createElement('div');
    const body = document.createElement('div'); body.className = 'modal-body';
    const btn = document.createElement('button'); btn.id = 'test-btn'; btn.textContent = 'OK';
    body.appendChild(btn);
    dialog.appendChild(body);

    // assigner manuellement dialogRef
    (comp as any).dialogRef = new ElementRef(dialog);

    // pour que focus() fonctionne, ajouter le dialog au document
    document.body.appendChild(dialog);

    // appeler la méthode d'ouverture privée via any
    (comp as any).onOpen?.();

    // on attend un tick pour l'appel setTimeout dans onOpen
    setTimeout(() => {
      try {
        expect(document.activeElement && (document.activeElement as HTMLElement).id === 'test-btn').toBeTrue();
        // nettoyer
        try { document.body.removeChild(dialog); } catch (err) {}
        try { btn.remove(); body.remove(); } catch (err) {}
        done();
      } catch (e) {
        done.fail(e as any);
      }
    }, 20);
  });
});
