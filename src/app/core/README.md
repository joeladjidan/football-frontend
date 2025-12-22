Core module

Ce dossier contient les services et interceptors globaux utilisés par l'application.

Exemples:
- `auth-interceptor.ts`: ajoute l'en-tête Authorization si un token est présent.

Provider:
- L'interceptor est enregistré dans `src/main.ts` via le provider HTTP_INTERCEPTORS.

Bonnes pratiques:
- Ne pas mettre de logique métier ici. Le `core` contient des utilitaires et des services globaux.
- Garder le `core` léger et stable — le code ici est partagé par tout le projet.

