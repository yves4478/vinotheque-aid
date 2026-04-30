# Coolify Deploy

This repo now includes an explicit production Docker setup for the web app.
Use the Dockerfile-based deployment mode in Coolify instead of an inferred
static/Nixpacks setup.

## Why this matters

- The app uses `BrowserRouter`, so direct requests like `/settings` or `/cellar`
  must fall back to `index.html`.
- `index.html` should not be cached aggressively, otherwise a domain can keep
  pointing at stale asset names after a redeploy.
- Built assets in `/assets/` can stay immutable because their filenames are hashed.

## Coolify settings

1. Create or update the resource to use the repository `Dockerfile`.
2. Set the internal port to `80`.
3. Make sure the public domain is attached to this Docker resource only.
4. Remove the same domain from any older static/Nixpacks resource.
5. Trigger a redeploy with cache disabled if Coolify offers that option.

## Exact setup in Coolify

### Option A: create a fresh Docker resource

Use this when the current domain probably still points to an older static
deployment.

1. Open the project in Coolify.
2. Click `New Resource`.
3. Choose your connected Git repository.
4. Choose `Dockerfile` as the build/deploy type.
5. Select the branch you want to deploy.
6. Keep the repository root as the build context.
7. Set the Dockerfile path to `./Dockerfile`.
8. Set the exposed/internal port to `80`.
9. Save the resource.
10. Open the `Domains` section of this new resource.
11. Attach your public domain there.
12. Deploy the resource once.

### Option B: convert the existing resource

Use this only if you are sure the current resource is the right one and you do
not have a second older static resource with the same domain.

1. Open the existing resource.
2. Check whether it is currently a `Static`, `Nixpacks`, or inferred build.
3. Switch it to the repository Dockerfile mode if Coolify allows editing that.
4. Set Dockerfile path to `./Dockerfile`.
5. Set the internal port to `80`.
6. Save.
7. Trigger a redeploy with `Force rebuild` or `No cache` if available.

## Domain cleanup

This is the part most likely causing the stale version problem.

1. Search the project/environment for the exact public domain.
2. Open every resource that still lists that domain.
3. Remove the domain from old static/Nixpacks resources.
4. Keep the domain on exactly one resource: the Docker resource for this repo.
5. If there is also a temporary `sslip.io` domain on an older resource, remove
   that too if it should no longer serve traffic.

## Build and runtime values

- Build context: repository root
- Dockerfile path: `./Dockerfile`
- Internal port: `80`
- Start command override: leave empty
- Publish directory: not needed for Dockerfile deploys

No special environment variables are required for the current web build.

## Redeploy order

1. Save the Docker resource settings.
2. Remove the domain from any old resource.
3. Start a fresh deploy on the Docker resource.
4. Prefer `Force rebuild` / `No cache`.
5. Wait until the deployment is marked healthy before testing the domain.

## What to verify afterwards

Open these in the browser after deploy:

1. `/`
2. `/settings`
3. `/cellar`

Expected behavior:

- `/` loads normally
- `/settings` and `/cellar` also load on a direct refresh
- the app no longer serves an older HTML shell with outdated asset names

## If it still serves the old version

Then the remaining suspects are outside the app build itself:

1. The public domain still points to the wrong Coolify resource.
2. An older proxy/container is still attached to the domain.
3. Coolify reused an old deployment instead of rebuilding the Docker resource.

## Expected result after a correct deploy

- `/` returns the latest `index.html`
- `/assets/...` returns hashed files from the current build
- client-side routes such as `/settings` load correctly on refresh
