# Frontend (Angular)

Structure recommandée (projet Angular professionnel)
- src/
  - app/
    - core/           -> services globaux, interceptors, guards partagés entre features (ex: auth-interceptor)
    - shared/         -> composants, pipes, directives réutilisables
    - features/       -> découpage par fonctionnalité (auth/, teams/ ...), chaque feature expose un `index.ts`
    - app-routing.module.ts
    - app.component.ts
  - assets/           -> images, icônes, styles globaux
  - environments/     -> configuration par environnement

Dans ce repo actuel
- `src/app/features/` contient les composants canoniques (auth, teams)
- `src/app/components/` et `src/app/guards/` ont été conservés en tant que ré-exports vers `features/` pour compatibilité
- `src/app/core/` contient les interceptors (ex: `auth-interceptor.ts`)

Scripts & exécution
- Installer les dépendances:
  - `npm ci` si `package-lock.json` existant (recommandé pour CI)
  - sinon `npm install`

- Build production:
  - `npm run build`

- Développement (serveur local):
  - `npm start`  (démarre `ng serve` sur 127.0.0.1:4200)

Script d'aide `cleanup.ps1`
- Ce script : sauvegarde les duplicatas (`src/app/components`, `src/app/guards`) vers `.dups_backup_YYYYMMDD_HHMMSS`, installe les dépendances et démarre l'app. Il propose aussi une purge optionnelle des backups plus anciens que X jours.

Exemples d'utilisation de `cleanup.ps1` (PowerShell):
```powershell
# depuis le dossier frontend
Set-Location 'D:\Travails\football-team\frontend'
# installer puis démarrer (avant-plan)
.\cleanup.ps1
# démarrer en arrière-plan
.\cleanup.ps1 -Background
# purger automatiquement les backups plus vieux que 30 jours
.\cleanup.ps1 -PurgeOlderThanDays 30 -AutoConfirmPurge
```

Conventions recommandées pour continuer la modernisation
- Convertir les composants partagés en modules `SharedModule` si vous passez à l'approche basée sur modules.
- Documenter chaque feature (`features/<name>/README.md`) décrivant l'API publique de la feature.
- Ajouter un pipeline CI qui exécute `npm ci` + `npm run build` + tests.

Notes
- Ne supprimez pas définitivement les dossiers `.dups_backup_*` avant vérification manuelle : utilisez `Get-ChildItem -Directory -Filter ".dups_backup_*"` pour les lister.

## Déploiement sur GitHub Pages
Un workflow GitHub Actions (`.github/workflows/frontend-pages.yml`) a été ajouté au dépôt pour builder le frontend et le déployer automatiquement sur GitHub Pages chaque fois qu'il y a un push sur `main` ou `master`.

Points importants :
- Le job `build` compile l'application et crée l'artefact dans `frontend/dist/football-frontend` (voir `angular.json` outputPath).
- Le job `deploy` utilise les actions officielles `upload-pages-artifact` et `deploy-pages` pour publier le contenu sur GitHub Pages.

Base href (attention)
- Pour un déploiement sur une GitHub Pages de type "project page" (ex: `https://<user>.github.io/<repo>/`), il faut définir le `base href` dans `index.html` ou lors du build :

  - Option 1 (à la build) :
    ```powershell
    cd frontend
    npm run build -- --base-href "/<repo>/"
    ```
  - Option 2 (modifier `index.html`) : remplacer `<base href="/">` par `<base href="/<repo>/">` si vous publiez sur une page de projet.

- Si vous publiez sur une "user/org page" (ex: `https://<user>.github.io/`), laissez le `base href` à `/`.

Activation & permissions
- Le workflow utilise la permission `pages: write` — GitHub Actions doit avoir l'autorisation d'écrire sur GitHub Pages (généralement activée par défaut pour les dépôts, mais vérifiez les paramètres du repo si besoin).

Déclencher manuellement
- Le workflow se déclenche automatiquement sur push vers `main`/`master`.
- Vous pouvez aussi déclencher manuellement depuis l'onglet Actions > sélectionner le workflow > Run workflow.

Vérifier le résultat
- Après le déploiement, GitHub Pages publiera l'URL indiquée dans l'onglet Pages du repo. Si la page ne s'affiche pas, vérifiez le `base href` et la présence du contenu dans `frontend/dist/football-frontend`.
