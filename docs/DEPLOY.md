# Deploy & CI/CD (cari-kerja-frontend)

## Environments

| Branch | Environment | VPS path | Docker service | Public URL |
|--------|-------------|---------|----------------|------------|
| `develop` | Staging | `/var/www/cari-kerja/fe-stage-cari-kerja` | `fe-stage` | https://fe-stage.cari-kerja.co.id |
| `main` | Production | `/var/www/cari-kerja/fe-prod-cari-kerja` (typical) | `fe-prod` | https://cari-kerja.co.id (typical) |

Production auto-deploy is **not** enabled. Staging deploys automatically after merge/push to `develop`.

Runtime is **Docker Compose** (shared file on the VPS: `/var/www/cari-kerja/docker-compose.yml`). Context for staging is `./fe-stage-cari-kerja`.

Staging API (do **not** deploy from this repo): https://be-stage.cari-kerja.co.id

## Pipelines

### CI — `.github/workflows/ci.yml`

- Runs on pull requests targeting `develop` or `main`
- Node 22 → `npm ci` → `npm run build`
- No Jest/lint scripts exist in this repo; CI does not invent them

### CD staging — `.github/workflows/deploy-staging.yml`

- Runs on push to `develop` and via **Actions → Deploy Staging → Run workflow**
- Uses **repository secrets** only (no GitHub Environment)
- SSHs into the VPS and runs [`scripts/deploy/staging-fe-remote.sh`](../scripts/deploy/staging-fe-remote.sh):
  1. `git pull` on `fe-stage-cari-kerja` (`develop`)
  2. `docker compose up -d --build fe-stage` (FE only)
  3. Soft `docker image prune -f` (no aggressive `-a` / builder prune)
  4. Health check `GET https://fe-stage.cari-kerja.co.id/`

## One-time GitHub + VPS setup

### 1. SSH deploy key — **reuse backend key (chosen)**

The VPS already authorizes `github-actions-cari-kerja-be-staging` in `/root/.ssh/authorized_keys`.

**Choice for this repo:** reuse the **same private key** already stored as `VPS_SSH_PRIVATE_KEY` on `cari-kerja-backend`. Copy that secret value into this frontend repo’s Actions secrets. Faster setup; one deploy identity for staging apps on the shared VPS.

If you later prefer isolation, generate a FE-only key:

```bash
ssh-keygen -t ed25519 -C "github-actions-cari-kerja-fe-staging" -f ./cari-kerja-fe-staging-deploy -N ""
```

Then append the **public** key to the VPS `authorized_keys` and put the private key in this repo’s `VPS_SSH_PRIVATE_KEY`.

Do **not** commit private keys or `.env`.

### 2. GitHub Secrets (repository secrets)

Repo → **Settings → Secrets and variables → Actions** → **New repository secret**.

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS hostname or IP (same as backend) |
| `VPS_PORT` | SSH port (usually `22`) |
| `VPS_USER` | SSH user (usually `root`) |
| `VPS_SSH_PRIVATE_KEY` | Full private key PEM (reuse backend staging deploy key) |

### 3. Compose build args (VPS)

Vite embeds `VITE_*` at **image build** time. Ensure `fe-stage` in `/var/www/cari-kerja/docker-compose.yml` passes args such as:

```yaml
fe-stage:
  build:
    context: ./fe-stage-cari-kerja
    args:
      VITE_API_BASE_URL: https://be-stage.cari-kerja.co.id/api/v1
      VITE_FILE_STORAGE_URL: https://be-stage.cari-kerja.co.id
      VITE_SOCKET_URL: https://be-stage.cari-kerja.co.id
      VITE_APP_NAME: cari-kerja.id
      # VITE_TURNSTILE_SITE_KEY: <optional>
```

### 4. Smoke test

1. Add the four secrets above (reuse BE key).
2. Merge the CI/CD PR into `develop`, **or** run **Deploy Staging** manually.
3. Confirm Actions job is green.
4. Open https://fe-stage.cari-kerja.co.id/ (or `curl -sS -o /dev/null -w "%{http_code}\n" https://fe-stage.cari-kerja.co.id/`).

## Local / manual deploy (ops)

On the VPS:

```bash
bash /var/www/cari-kerja/fe-stage-cari-kerja/scripts/deploy/staging-fe-remote.sh
```

Prefer this FE-only script over the older all-in-one `/var/www/cari-kerja/deploy-stage.sh`.

## Docker notes

- Image builds from context `./fe-stage-cari-kerja` using this repo’s `Dockerfile` (Node 22 builder → nginx).
- Host port mapping is typically `3001` → container `80`; nginx terminates TLS for `fe-stage.cari-kerja.co.id`.
- `.dockerignore` keeps `.env`, `node_modules`, and docs out of the build context.
- Do not put `.env` or SSH keys in git.

## Production (later)

When ready, mirror this flow for `main` → `fe-prod` with a separate workflow and stronger approvals. Do not auto-deploy production from this staging pipeline.
