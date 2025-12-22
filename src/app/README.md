# Frontend - structure par fonctionnalités

Le dossier `src/app` est organisé par "features" (fonctionnalités). Chaque feature contient ses composants, services et guards.

Arborescence recommandée :

- src/app/
  - features/
    - auth/
      - auth.service.ts
      - auth.guard.ts
      - role.guard.ts
      - login.component.ts
      - index.ts  // barrel exports
    - teams/
      - teams.service.ts
      - teams-list.component.ts
      - team-create.component.ts
      - index.ts  // barrel exports
  - app-routing.module.ts
  - app.component.ts
  - auth-interceptor.ts

Guidelines
- Importer depuis la feature via le barrel, p.ex. `import { AuthService } from './features/auth';`
- Les anciens fichiers top-level exportent maintenant vers les features pour compatibilité. Vous pouvez supprimer ces fichiers quand tous les imports du projet utilisent directement `features/*`.

Pour compiler et lancer le projet :

```bash
cd frontend
npx tsc --noEmit
npx ng serve
```


