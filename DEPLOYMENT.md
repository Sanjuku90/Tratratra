# Déploiement NexusTrade — Render + Turso

## 1. Créer une base Turso

1. Crée un compte sur [turso.tech](https://turso.tech)
2. Installe la CLI :
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. Connecte-toi et crée une base :
   ```bash
   turso auth login
   turso db create nexustrade
   turso db show nexustrade   # copie l'URL (libsql://...)
   turso db tokens create nexustrade  # copie le token
   ```

## 2. Variables d'environnement nécessaires

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | URL Turso (ex: `libsql://nexustrade-xxx.turso.io`) |
| `TURSO_AUTH_TOKEN` | Token d'authentification Turso |
| `CLERK_SECRET_KEY` | Clé secrète Clerk (depuis Replit secrets) |
| `CLERK_PUBLISHABLE_KEY` | Clé publique Clerk (depuis Replit secrets) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Même valeur que CLERK_PUBLISHABLE_KEY |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render l'assigne automatiquement) |

## 3. Pousser le schéma en production

Après avoir créé la base Turso, lance cette commande pour créer les tables :
```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... pnpm --filter @workspace/db run push
```

## 4. Déployer sur Render

### Option A — via render.yaml (recommandé)

1. Connecte ton repo GitHub à [render.com](https://render.com)
2. Render détecte automatiquement le fichier `render.yaml`
3. Ajoute les variables d'environnement dans le Dashboard Render :
   - Settings → Environment → Add variables
4. Lance le premier déploiement

### Option B — configuration manuelle

- **Type** : Web Service
- **Runtime** : Node
- **Build command** :
  ```
  npm install -g pnpm@10 && pnpm install --frozen-lockfile && PORT=3000 BASE_PATH=/ pnpm --filter @workspace/trading-platform run build && pnpm --filter @workspace/api-server run build
  ```
- **Start command** :
  ```
  node --enable-source-maps artifacts/api-server/dist/index.mjs
  ```
- **Health check** : `/api/healthz`

## 5. Architecture de production

```
Render Web Service
├── Express API server (artifacts/api-server/dist/index.mjs)
│   ├── /api/* → routes API (protégées par Clerk)
│   └── /*    → sert le frontend statique (artifacts/trading-platform/dist/public/)
└── Base de données → Turso (SQLite distribué)
```

## 6. Développement local

La base SQLite locale se trouve dans `artifacts/api-server/dev.db`.
Pour repousser le schéma en dev :
```bash
pnpm --filter @workspace/db run push-dev
```
