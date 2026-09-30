# AGENTS.md

Prototype: Apache reverse proxy acting as the sole gateway/auth layer in front of a
container cluster. `proxy -> {reactjs, nodejs, pma}`, `nodejs -> mysql`, `pma -> mysql`.

## Per-change checklist (all five, every change)

1. `codebase/` — update the affected service's code.
2. `docbase/` — update `TOCTREE.md` + the relevant `docbase/doc/*.md`.
3. `README.md` — must link/reference `docbase/TOCTREE.md`.
4. `CHANGELOG.md` — new entry, version `major.minor.patch`.
5. Git: branch `dev-001`, commit with `major.minor.patch` as the **subject** and a
   descriptive body, then `git push origin dev-001`.

Never commit directly to `dev` or `main` — CI auto-merges upward.

## Target layout (not yet created — see "Layout drift")

```
codebase/
  docker-compose.yml        <- the whole runnable stack lives here
  .env                      <- gitignored, from .env.example
  .env.example
  apache/ mysql/ nodejs/ reactjs/
docbase/
  TOCTREE.md
  doc/{PRD,SRS,ProjectCharter,ADR,Architecture,API,Schema,ERD,QuickStart,RTM,CRM}.md
```

`codebase/` is the single root of everything executable: Compose file, env files, and
the four services. Only `docbase/`, `README.md`, `CHANGELOG.md`, `AGENTS.md`,
`LICENSE`, `.gitignore`, and `.github/` live outside it.

### Layout drift — current reality

`codebase/` and `docbase/` **do not exist yet**. At repo root today: `apache/`,
`mysql/`, `nodejs/`, `reactjs/`, `docker-compose.yml`, `.env.example`.
There is no `CHANGELOG.md` and `README.md` does not reference `TOCTREE.md`. Baseline
version is **1.0.0**; the first session to create `docbase/` seeds `CHANGELOG.md` at
1.0.0.

Migration notes for whoever does the move:

- The four `build:` paths in `docker-compose.yml` (`./apache` etc.) are resolved
  **relative to the compose file**, so moving the file into `codebase/` keeps them
  valid as `./apache` — do NOT rewrite them to `./codebase/apache`.
- Same for the bind mounts: `./mysql/data` and `./mysql/init.sql` follow the move.
- `.gitignore` needs attention: `mysql/data` contains a slash, so git anchors it to
  the repo root and it will stop matching once the path becomes `codebase/mysql/data`.
  Change it to `**/mysql/data` (or list both). The bare `.env` pattern has no slash
  and keeps matching at any depth, so it needs no change.
- `.env` lookup: Compose resolves the default env file from the project directory,
  which defaults to the directory holding the compose file. After the move, run
  Compose from inside `codebase/` (or pass `--project-directory codebase`) or `.env`
  will silently not be found and every `${MYSQL_*}` expands to empty.
- README's build/run snippets are root-relative and must be updated in the same pass.

## Branches / CI

`dev-001` → `dev` → `main`, both hops automated by `.github/workflows/auto-merge.yml`.

- `auto_merge_dev_001_to_dev`: on push to `dev-001`, merges into `dev`.
- `auto_merge_dev_to_main`: on push to `dev`, merges into `main`.
- `concurrency.group: auto-merge` serializes both so merges can't interleave.
- Requires repo secret **`GIT_PUSH_TOKEN`** (fine-grained PAT, Contents: read+write).
  The built-in `GITHUB_TOKEN` will **not** trigger the next workflow, so the cascade
  to `main` silently stops without a PAT. PAT also needs branch-protection bypass.

**README.md is stale here:** it documents the pipeline as `.gitlab-ci.yml` and embeds
the YAML inline. No `.gitlab-ci.yml` exists. Trust
`.github/workflows/auto-merge.yml`.

## Build & run

Prerequisites, in order:

```shell
# 1. External network MUST exist first — compose declares it `external: true` and fails without it.
docker network create -d bridge --subnet 172.70.0.0/24 prototype_application_proxy

# 2. .env does not ship; copy the example.
cp .env.example .env

# 3. htpasswd must exist before the apache image will build (Dockerfile COPYs it).
#    -c OVERWRITES the file and destroys every other user. Use it once for `admin`,
#    then add further users WITHOUT -c (2+ users are a project requirement):
htpasswd -c apache/.htpasswd admin
htpasswd    apache/.htpasswd user2

docker compose build --no-cache
docker compose up -d --force-recreate
```

After the `codebase/` migration every path in that block gains a `codebase/` prefix,
and Compose must be invoked so it finds `codebase/.env` — run from inside `codebase/`
(`docker compose build` with workdir `codebase`) or use
`-f codebase/docker-compose.yml --project-directory codebase`.

- Host port is **2380**, not 80. Only the proxy publishes a port; reactjs/nodejs/pma
  are `expose:`-only and reachable via `prototype-application-proxy-*` container names.
- `nodejs` and `pma` wait on `mysql` via `condition: service_healthy`; don't drop that.
- There is **no test, lint, or typecheck** in this repo. The only verification is
  `docker compose build` + hitting the endpoints.
- `reactjs` is create-react-app (`react-scripts`), so `CI=true npm run build` turns
  warnings into build failures.

## Gotchas an agent will otherwise hit

- **`mysql/init.sql` only runs when `mysql/data` is empty.** `/docker-entrypoint-initdb.d`
  is skipped on every restart after the first. To re-apply schema changes you must
  wipe the bind mount: `rm -rf mysql/data && docker compose up -d`
  (post-migration: `rm -rf codebase/mysql/data`).
- **`apache/.htpasswd` is committed to git.** Credentials are in version control.
  Treat this as a known debt item; don't add more users to the tracked file without
  flagging it.
- **Auth is currently only on `/reactjs`** (`apache/vhost.conf`). `/pma` and `/nodejs`
  are wide open — phpMyAdmin and the raw API need no credentials. This contradicts
  the "proxy safeguards everything with 2+ users" goal; extending `<Location>`
  auth blocks is the obvious next piece of work.
- **The React health panel is broken.** `reactjs/src/index.js` fetches `/api/health`,
  but Apache only proxies `/nodejs`, `/pma`, `/reactjs` — there is no `/api` route, and
  `reactjs/nginx.conf` has no `/api` location either. Either fetch `/nodejs/api/health`
  or add a `ProxyPass /api`.
- **CRA static assets 404 under the `/reactjs` prefix.** `reactjs/package.json` has no
  `homepage`, so the build emits absolute `/static/...` paths that Apache never routes.
  Set `"homepage": "."` (or `/reactjs`) in `reactjs/package.json`.
- **No lockfiles are committed.** Both Dockerfiles `COPY package*.json` + `npm install`,
  so image builds are non-reproducible. Commit `package-lock.json` to pin them.
- **`nodejs/` has no `.dockerignore`** (only `reactjs/` does). A local `node_modules`
  or stray `.env` gets copied into the image by `COPY . .`.
- **`PMA_ABSOLUTE_URI` hardcodes the host** `http://hkss13:2380/pma/` in
  `docker-compose.yml`. Change it or phpMyAdmin's redirects break on any other hostname.
- **Apache base image is `httpd:2.4`** (Debian layout, config under
  `/usr/local/apache2/`), not Alpine. Modules are uncommented in `httpd.conf` via `sed`;
  the vhost is wired in with an `Include conf/extra/vhost.conf` line appended at build
  time — there's no default `Listen`/vhost removal to fight.

## Conventions

- Docker image / container names are all prefixed `prototype-application-proxy[-suffix]`
  and `:latest`. `apache/vhost.conf` and `docker-compose.yml` environment blocks must
  stay in sync — they hardcode these names and the `DB_*` variable names.
- `.env` holds `MYSQL_{ROOT_PASSWORD,DATABASE,USER,PASSWORD}`; compose maps them into
  the API as `DB_NAME` / `DB_USER` / `DB_PASS`. Never commit `.env` (it's gitignored).
- Docs contain a mix of English and Chinese comments. Match the surrounding file's
  language rather than normalizing.