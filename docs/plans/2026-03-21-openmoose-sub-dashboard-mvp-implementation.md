# OpenMoose Sub-Dashboard MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the official website login-gated sub-dashboard, signed cluster-entry authorization, and entry-server routing so a user can sign in on `openmoose.ai`, see their assigned cluster, and enter the existing `cluster-dashboard` through `cluster-001.cluster-dash.openmoose.ai`.

**Architecture:** Keep a single public entry machine for the MVP. Recommended rollout: 1 AWS Lightsail instance + 1 Static IP. Serve the marketing site and `/dashboard` from the `Openmoose_Frontend` Vite build through Nginx, run a thin Node API on the same machine for Supabase-backed auth and cluster authorization, and protect `*.cluster-dash.openmoose.ai` with Nginx `auth_request` against a short-lived signed cookie issued by the website backend. Keep `Agent_Cluster` as the private cluster control plane behind the proxy and do not move subscription logic into it.

**Tech Stack:** Vite, React, TypeScript, Supabase Auth, Supabase Postgres, Node HTTP server, Nginx, systemd, Amazon Linux 2023

---

## Scope And Assumptions

- Primary implementation repo: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend`
- Existing cluster dashboard repo remains: `D:\2025-27_CS_AI\Projects\Agent_Cluster`
- Entry server for website, API, and wildcard subdomain gateway: single Lightsail instance with Static IP
- Current test cluster dashboard target: existing `cluster-001` on `agent_1`
- MVP uses a static Nginx host-to-upstream map for known clusters; database remains business source of truth, but Nginx mapping is updated manually for now
- MVP does not add billing flows, automatic cluster provisioning, PM2, or extra monitoring stack

## Target End State

1. A signed-in user opens `https://openmoose.ai/dashboard`.
2. The page loads the user profile, subscription state, and authorized clusters from the website backend.
3. Clicking `Open Dashboard` calls the website backend on `openmoose.ai`.
4. The backend validates Supabase auth and DB access, then sets a short-lived `HttpOnly` cluster access cookie scoped to `.openmoose.ai`.
5. The browser navigates to `https://cluster-001.cluster-dash.openmoose.ai`.
6. Nginx on the entry server calls the website backend through `auth_request` to validate the cookie against the requested host.
7. If valid, Nginx proxies to the private cluster dashboard upstream on port `3000`; if not, the user is redirected back to `https://openmoose.ai/dashboard`.

## Implementation Order

### Task 1: Stabilize the `Openmoose_Frontend` workspace for app + API development

**Files:**
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\package.json`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\vitest.config.ts`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\test\setup.ts`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\lib\env.mjs`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\.env.example`

**Step 1: Write the failing tooling smoke test**

Create a tiny test such as `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\pages\Dashboard.test.tsx` that only renders a placeholder and expects `"Dashboard"` text.

**Step 2: Run test to verify the repo is not test-ready yet**

Run: `npm run test -- --runInBand`

Expected: FAIL because no `test` script or Vitest setup exists yet.

**Step 3: Add the minimum dev tooling**

Add scripts for:

- `dev`
- `build`
- `api`
- `typecheck`
- `test`

Populate `.env.example` with:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=https://openmoose.ai
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=https://openmoose.ai
API_PORT=8787
CLUSTER_PROTOCOL=https
LAUNCH_TOKEN_SECRET=
LAUNCH_TOKEN_TTL_SECONDS=300
CLUSTER_COOKIE_NAME=om_cluster_access
CLUSTER_COOKIE_DOMAIN=.openmoose.ai
```

**Step 4: Run the test and typecheck again**

Run:

```bash
npm run test -- --run
npm run typecheck
```

Expected: PASS for the smoke test and clean TypeScript compilation.

**Step 5: Commit**

```bash
git add package.json vitest.config.ts src/test/setup.ts server/lib/env.mjs .env.example
git commit -m "chore: add sub-dashboard test and env baseline"
```

### Task 2: Add typed sub-dashboard API contracts and browser client

**Files:**
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\services\subDashboardApi.ts`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\services\subDashboardTypes.ts`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\contexts\AuthContext.tsx`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\lib\supabase.ts`

**Step 1: Write the failing API-client tests**

Create tests that cover:

- `fetchSubDashboard()` adds `Authorization: Bearer <token>`
- `launchCluster(clusterSlug)` uses `POST`
- same-origin cookie writes are enabled by including credentials

Example expectation:

```ts
expect(fetch).toHaveBeenCalledWith(
  "https://openmoose.ai/api/clusters/cluster-001/launch",
  expect.objectContaining({
    method: "POST",
    credentials: "include",
  }),
);
```

**Step 2: Run the tests to confirm failure**

Run: `npm run test -- --run src/app/services/subDashboardApi.test.ts`

Expected: FAIL because the service files do not exist yet.

**Step 3: Implement the browser-side API layer**

Add:

- typed DTOs for user, subscription, cluster card, and launch response
- helper to pull the current Supabase session access token
- `fetchSubDashboard()`
- `launchCluster(clusterSlugOrId)`

Update auth context only if needed to expose session state without leaking backend-only secrets.

**Step 4: Re-run the targeted tests**

Run: `npm run test -- --run src/app/services/subDashboardApi.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/services/subDashboardApi.ts src/app/services/subDashboardTypes.ts src/app/contexts/AuthContext.tsx src/lib/supabase.ts
git commit -m "feat: add sub-dashboard browser api client"
```

### Task 3: Replace the current marketing-style `/dashboard` page with the real sub-dashboard

**Files:**
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\components\dashboard\SubscriptionCard.tsx`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\components\dashboard\ClusterList.tsx`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\components\dashboard\DashboardGate.tsx`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\pages\Dashboard.tsx`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\routes.tsx`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\components\Header.tsx`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\src\app\pages\SignIn.tsx`

**Step 1: Write the failing dashboard page tests**

Cover:

- unauthenticated user is redirected to `/signin`
- authenticated user sees loading, then subscription card and cluster list
- granted + ready cluster shows enabled `Open Dashboard`
- pending cluster shows disabled button and provisioning copy

**Step 2: Run the test to verify it fails**

Run: `npm run test -- --run src/app/pages/Dashboard.test.tsx`

Expected: FAIL because the route still renders the pricing UI.

**Step 3: Implement the real sub-dashboard page**

The new `/dashboard` should:

- require auth
- call `fetchSubDashboard()` on load
- render user info, subscription state, and clusters
- call `launchCluster()` on click
- redirect the browser with `window.location.assign(launchUrl)` after the backend has set the cookie

Also fix the current sign-in flow to `await login(...)` and only navigate on success.

**Step 4: Re-run the page tests**

Run: `npm run test -- --run src/app/pages/Dashboard.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/components/dashboard src/app/pages/Dashboard.tsx src/app/routes.tsx src/app/components/Header.tsx src/app/pages/SignIn.tsx
git commit -m "feat: add authenticated sub-dashboard page"
```

### Task 4: Refactor the website backend into reusable auth, token, and data helpers

**Files:**
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\index.mjs`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\lib\responses.mjs`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\lib\supabaseAdmin.mjs`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\lib\cookies.mjs`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\lib\clusterAccessToken.mjs`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\lib\clusterQueries.mjs`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\clusterAccessToken.test.mjs`

**Step 1: Write the failing backend helper tests**

Cover:

- token signing and verification
- expired token rejection
- hostname mismatch rejection
- cookie serialization includes `HttpOnly`, `Secure`, and the configured domain

**Step 2: Run the tests to confirm failure**

Run: `node --test server/clusterAccessToken.test.mjs`

Expected: FAIL because the helper modules do not exist yet.

**Step 3: Extract helper modules**

Create helpers for:

- JSON responses and shared headers
- Supabase admin client bootstrap
- cookie creation and clearing
- cluster DB lookups
- signed token create/verify logic

Keep `server/index.mjs` as the HTTP entrypoint only.

**Step 4: Re-run the helper tests**

Run: `node --test server/clusterAccessToken.test.mjs`

Expected: PASS.

**Step 5: Commit**

```bash
git add server/index.mjs server/lib server/clusterAccessToken.test.mjs
git commit -m "refactor: extract backend auth and token helpers"
```

### Task 5: Upgrade the launch flow from JSON token return to signed cookie + internal host authorization

**Files:**
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\index.mjs`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\README.md`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\test-api.ps1`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\database\2026-03-21-subdashboard-init.sql`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\internalAuth.test.mjs`

**Step 1: Write the failing endpoint tests**

Cover:

- `POST /api/clusters/:slug/launch` sets `Set-Cookie` and returns `launchUrl`
- `GET /internal/cluster-auth` returns `200` only when:
  - cookie signature is valid
  - cookie is not expired
  - `dashboardHostname` in cookie matches requested host
  - `cluster_access` is still `granted`
  - cluster status is still `ready`
- invalid auth returns `401` or `403`

**Step 2: Run the backend tests to confirm failure**

Run:

```bash
node --test server/clusterAccessToken.test.mjs server/internalAuth.test.mjs
```

Expected: FAIL because the cookie-based gateway logic is not implemented yet.

**Step 3: Implement the stricter gateway flow**

Change the backend contract to:

- `GET /api/me/sub-dashboard`: unchanged business response
- `POST /api/clusters/:clusterIdOrSlug/launch`:
  - authenticates the user with Bearer token
  - checks DB access and cluster status
  - sets `Set-Cookie: om_cluster_access=...; HttpOnly; Secure; SameSite=Lax; Domain=.openmoose.ai; Path=/`
  - returns `launchUrl` and `expiresAt`
- `GET /internal/cluster-auth`:
  - reads the signed cookie
  - reads `X-Original-Host`
  - validates signature, expiry, host match, and current DB access
  - returns `200` for allow, `401/403` for deny
- optional `POST /api/logout` or cookie clear helper:
  - clears the cluster cookie on sign-out so cross-subdomain access ends cleanly

If helpful, extend the SQL comments or seed data so `dashboard_hostname` stays aligned with the Nginx host map.

**Step 4: Re-run backend tests and API script**

Run:

```bash
node --test server/clusterAccessToken.test.mjs server/internalAuth.test.mjs
powershell -ExecutionPolicy Bypass -File server/test-api.ps1
```

Expected:

- tests PASS
- `test2@example.com` can launch
- pending and unsubscribed users remain blocked

**Step 5: Commit**

```bash
git add server/index.mjs server/README.md server/test-api.ps1 database/2026-03-21-subdashboard-init.sql server/internalAuth.test.mjs
git commit -m "feat: add signed cluster cookie gateway auth"
```

### Task 6: Add deployment assets for entry-server Nginx and website API service

**Files:**
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\deploy\nginx\openmoose-entry.conf.example`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\deploy\systemd\openmoose-subdashboard-api.service`
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\deploy\README.md`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\README.md`

**Step 1: Write the failing deployment-doc checklist**

Create a checklist in `deploy/README.md` that names the exact missing assets:

- website server block
- wildcard cluster server block
- auth_request location
- systemd service for backend API
- frontend build publish path

**Step 2: Verify the assets do not exist yet**

Run:

```bash
dir deploy
```

Expected: FAIL conceptually because the deployment templates are missing.

**Step 3: Add deployable templates**

The Nginx example should include:

- one server block for `openmoose.ai` and `www.openmoose.ai`
- one wildcard server block for `~^cluster-[0-9]+\.openmoose\.ai$`
- `root /var/www/openmoose-frontend`
- `location /api/` -> proxy to `http://127.0.0.1:8787`
- internal auth location that proxies to `http://127.0.0.1:8787/internal/cluster-auth`
- static `map $host $cluster_upstream` section for known clusters
- deny fallback for unknown hosts

The systemd service should run one Node process from the deployed repo checkout.

**Step 4: Validate the examples**

Run:

```bash
npm run build
```

Expected: PASS for the frontend build so the static publish path described in the docs is real.

**Step 5: Commit**

```bash
git add deploy README.md
git commit -m "docs: add website api and nginx deployment templates"
```

### Task 7: Prepare the manual operator runbook for Supabase, DNS, Nginx, and entry-server hardening

**Files:**
- Create: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\deploy\RUNBOOK-agent-1.md`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\README.md`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\README.md`

**Step 1: Write the failing runbook outline**

Start with these headings only:

- Supabase setup
- Cloudflare / DNS
- entry-server filesystem layout
- systemd
- Nginx
- security group rules
- validation checklist

**Step 2: Confirm the operator steps are not documented clearly enough yet**

Read the current README files and note the missing pieces:

- no Nginx config path
- no systemd unit commands
- no Supabase redirect URL checklist
- no security group hardening steps

**Step 3: Fill in the runbook**

Document the exact operator actions below.

**Supabase actions**

1. Create or verify auth users:
   - `test2@example.com`
   - `qa_pending@example.com`
   - `qa_unsubscribed@example.com`
2. In Supabase Auth settings, set:
   - Site URL: `https://openmoose.ai`
   - Redirect URL: `https://openmoose.ai/auth/callback`
3. Run `database/2026-03-21-subdashboard-init.sql`.
4. Confirm `clusters.dashboard_hostname` matches the intended public subdomain.
5. Copy out:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

**Cloudflare / DNS actions**

1. Attach a Static IP to the Lightsail entry server.
2. Point `openmoose.ai` to that Static IP.
3. Point `www.openmoose.ai` to the same public IP if used.
4. Point `*.cluster-dash.openmoose.ai` to the same public IP.
5. Enable proxied HTTPS if that is your chosen Cloudflare mode.
6. Ensure the TLS mode matches the certificate setup on the entry server.

**Entry-server filesystem and service actions**

1. Deploy repo checkout, for example:
   - `/home/ec2-user/Openmoose_Frontend`
2. Build frontend:

   ```bash
   cd /home/ec2-user/Openmoose_Frontend
   npm ci
   npm run build
   sudo mkdir -p /var/www/openmoose-frontend
   sudo rsync -a --delete dist/ /var/www/openmoose-frontend/
   ```

3. Create backend env file, for example:
   - `/etc/openmoose/subdashboard.env`
4. Install systemd unit:

   ```bash
   sudo cp deploy/systemd/openmoose-subdashboard-api.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable openmoose-subdashboard-api
   sudo systemctl restart openmoose-subdashboard-api
   sudo systemctl status openmoose-subdashboard-api
   ```

**Nginx actions**

1. Copy the example config to `/etc/nginx/conf.d/openmoose-entry.conf`.
2. Replace example hostnames, cert paths, and upstream IPs.
3. Keep `3000` private and proxy only from Nginx.
4. Validate and reload:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

**Security group actions**

- Keep `22` restricted to your own IP.
- Allow `80` and `443` publicly.
- Remove public inbound `3000`.
- Keep backend API port `8787` private to localhost only; do not open it in the security group.

**Validation actions**

1. `curl https://openmoose.ai`
2. `curl https://openmoose.ai/api/health` or `/health` if that is the chosen path
3. Sign in as `test2@example.com`
4. Confirm `/dashboard` shows assigned cluster
5. Click `Open Dashboard`
6. Confirm `https://cluster-001.cluster-dash.openmoose.ai` loads the existing `cluster-dashboard`
7. Confirm a direct visit without valid cookie redirects or denies

**Step 4: Review the runbook with the build docs**

Run:

```bash
npm run build
```

Expected: PASS, with no documented paths that contradict the actual build output.

**Step 5: Commit**

```bash
git add deploy/RUNBOOK-agent-1.md server/README.md README.md
git commit -m "docs: add operator runbook for sub-dashboard mvp"
```

### Task 8: Final end-to-end verification in local and deployment-like environments

**Files:**
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\README.md`
- Modify: `D:\2025-27_CS_AI\Projects\Openmoose_Frontend\server\README.md`

**Step 1: Run the full local verification set**

Run:

```bash
cd D:\2025-27_CS_AI\Projects\Openmoose_Frontend
npm ci
npm run test -- --run
npm run typecheck
npm run build
node --test server/clusterAccessToken.test.mjs server/internalAuth.test.mjs
powershell -ExecutionPolicy Bypass -File server/test-api.ps1
```

Expected:

- frontend tests PASS
- backend helper tests PASS
- typecheck PASS
- build PASS
- API smoke script matches the three-user access matrix

**Step 2: Run deployment-like verification on the entry server**

Run:

```bash
cd /home/ec2-user/Openmoose_Frontend
npm ci
npm run build
sudo rsync -a --delete dist/ /var/www/openmoose-frontend/
sudo systemctl restart openmoose-subdashboard-api
sudo nginx -t
sudo systemctl reload nginx
```

Expected: all commands succeed.

**Step 3: Run browser verification**

Check:

- login succeeds
- `/dashboard` renders live subscription data
- `test2@example.com` can enter `cluster-001`
- `qa_pending@example.com` sees provisioning and cannot launch
- unauthenticated browser cannot browse `cluster-001.cluster-dash.openmoose.ai`

**Step 4: Update docs with final known gaps**

Document any remaining MVP limitations, especially:

- static Nginx host map still manual
- no payment flow yet
- no auto-provisioning yet
- current gateway assumes low-traffic MVP usage on a 2 GB machine

**Step 5: Commit**

```bash
git add README.md server/README.md
git commit -m "docs: record verified sub-dashboard mvp workflow"
```

## Manual Deployment Handoff

These are the places where you will need to do real-world deployment work after the code is ready.

### Supabase

- Create or verify the three test users in Auth.
- Run the SQL bootstrap file.
- Copy the anon key, URL, and service-role key into the backend/frontend env files.
- Confirm redirect URLs include `https://openmoose.ai/auth/callback`.

### Cloudflare / DNS

- Attach one Static IP to a single Lightsail entry server.
- Point root and wildcard DNS records to that Static IP.
- Enable TLS and make sure the cert strategy matches the Nginx config.

### Lightsail entry server

- Pull the latest `Openmoose_Frontend` repo.
- Build the static frontend.
- Publish the `dist/` folder to Nginx web root.
- Install the backend env file.
- Install and enable the website API systemd service.
- Install and reload the Nginx config.
- Do not add a load balancer for the MVP.
- Automatic snapshots are optional and can stay off for now.
- Remove public exposure of port `3000`.

### Existing `Agent_Cluster` deployment

- Keep the current `cluster-dashboard` service on port `3000`.
- Confirm Nginx on the Lightsail entry server can still reach that service through the intended routing path.
- Do not move subscription or auth logic into the `Agent_Cluster` repo.

## Notes For Execution

- Implement inside `D:\2025-27_CS_AI\Projects\Openmoose_Frontend`, not this repo.
- Treat `D:\2025-27_CS_AI\Projects\Agent_Cluster` as an integration dependency and reference implementation only.
- Keep the first rollout lightweight for the entry server:
  - one Nginx instance
  - one Node API process
  - static frontend files
  - no extra sidecar services
