# Deployment Runbook — Beta Storia Wedding

Dokumen ini menjelaskan deployment dan verifikasi production untuk website undangan Beta Storia.

## Production topology

```text
Frontend
  https://wedding.benifin.my.id
      |
      v
Backend API
  https://api.benifin.my.id
      |
      v
PostgreSQL production
      |
      v
Notion RSVP Recap
```

PostgreSQL adalah database operasional utama. Notion hanya digunakan sebagai rekap RSVP.

## Source repositories

### Frontend

- Repository: `https://github.com/Beniferri/undangan`
- Branch production: `4.x`
- Coolify application: `qs4xdx4n6smfwxipii216kql`
- Build pack: Dockerfile
- Public port: `80`
- Health check: `GET /`

### Backend

- Repository: `https://github.com/Beniferri/betastoria-wedding-api`
- Branch production: `main`
- Coolify application: `7of7n6bwwuod9nb6xfftgnal`
- Build pack: Dockerfile
- Internal port: `8080`
- Health check: `GET /api/health`

### Database

- Coolify project: `Betastoria Wedding`
- Environment: `production`
- Active PostgreSQL resource: `betastoria-wedding-postgres-v2`
- Resource UUID: `if0c6d0bnpx1zafvc0g6mfql`
- Database access: private; never expose credentials in source, logs, or chat.

## Coolify project

- Project UUID: `vksjfoq93v69n88v94ki12bi`
- Environment UUID: `fe66i20yxngzqbdpz5ujpmwi`
- Server: `localhost`
- Coolify version verified: `4.3.23`

## Environment variable names

The following values are configured in Coolify secrets/environment settings. Values must never be committed:

- `DATABASE_URL`
- `DATABASE_SSL`
- `ADMIN_TOKEN`
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `PUBLIC_ORIGIN`

## Frontend deployment procedure

1. Confirm the working tree and branch:

   ```bash
   git status --short --branch
   git branch --show-current
   ```

2. Make focused changes on a feature/fix branch. Do not commit `.env` files or secrets.
3. Validate locally:

   ```bash
   git diff --check
   npm run lint:js
   npm run lint:css
   npm run lint:html
   npm run build
   ```

4. Search for content regressions before commit:

   ```bash
   grep -RniE 'DUMMY|TEST|VERIFY|lorem ipsum|Bima|Alya|Raka|Dewanakl|Bestieee|Pajerukan' \
     --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist .
   ```

5. Commit with a focused message and push to branch `4.x` through the normal review process.
6. Trigger deployment for application `qs4xdx4n6smfwxipii216kql` in Coolify.
7. Wait for deployment status `finished` and application status `running:healthy`.
8. Verify the deployed commit matches the intended GitHub commit.

## Backend deployment procedure

1. Review the backend repository and schema before changing runtime behavior.
2. Confirm the production database target is `betastoria-wedding-postgres-v2`.
3. Validate locally:

   ```bash
   node --check server.js
   git diff --check
   ```

4. Deploy application `7of7n6bwwuod9nb6xfftgnal` from the `main` branch.
5. Wait for `running:healthy`.
6. Verify:

   ```bash
   curl -fsS https://api.benifin.my.id/api/health
   ```

   Expected response shape:

   ```json
   {"ok":true,"database":"connected"}
   ```

Do not test RSVP writes in production unless the test data and cleanup procedure are explicitly approved.

## Post-deployment smoke test

### Frontend

- `https://wedding.benifin.my.id/` returns HTTP `200`.
- Final names, date, venue, address, and gift information are rendered.
- QRIS is absent.
- No `DUMMY`, upstream branding, or placeholder copy is present.
- Computed heading font is `Cormorant Garamond`.
- Computed body font is `DM Sans`.
- Mobile viewport has no horizontal overflow.
- CSS, JS, images, video, favicon, and Google Maps URL load successfully.
- `prefers-reduced-motion: reduce` rules are present and effective.

### Backend

- `GET /api/health` returns HTTP `200` and database `connected`.
- `GET /api/guestbook` returns HTTP `200`.
- CORS allows the frontend origin and `X-Guestbook-Client`.
- If an approved RSVP test is performed, verify the API response contains `notion_synced: true`, then verify the data in PostgreSQL and Notion independently.
- Verify guestbook persistence after refresh.
- Verify like idempotency for the same client identity and incrementing behavior for distinct identities.

## Rollback

### Frontend

1. Identify the last known-good commit/deployment in Coolify.
2. Revert through GitHub or redeploy the known-good commit.
3. Do not force-push `4.x`.
4. Re-run the frontend smoke test.

### Backend

1. Stop and assess the failed deployment before changing the database.
2. Redeploy the last known-good backend commit.
3. Verify `/api/health`, guestbook reads, and critical API behavior.
4. Never run destructive schema changes as part of an emergency rollback.

## Database safety

- Do not drop, truncate, or delete production data without explicit approval.
- Schema startup must remain idempotent (`CREATE TABLE IF NOT EXISTS`).
- Backup schedule should be configured separately in Coolify; it was intentionally skipped during the current maintenance pass.
- Confirm the active database before any migration or cleanup.

## Current operational notes

- Frontend and backend production were last verified healthy on 2026-09-19.
- Legacy `betastoria-wedding-api-v2` was stopped but not deleted because it had no domain and was configured against the wrong repository.
- The API v2 resource remains available for audit/rollback decisions; do not start it without reviewing its repository and configuration.
- Keep this document free of tokens, passwords, connection strings, and Notion credentials.
