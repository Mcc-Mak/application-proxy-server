# Configuration Reference

Every variable, file and setting the stack depends on, and where it comes from.

## Environment variables

`codebase/.env`, never committed, copied from `codebase/.env.example`. Compose
substitutes these at parse time, so a missing value expands to an empty string
rather than raising an error — which is why a missing `.env` produces a confusing
MySQL failure rather than an obvious one.

| Variable | Consumed by | Purpose |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | `mysql` | root account password; also interpolated into the healthcheck command |
| `MYSQL_DATABASE` | `mysql`, `nodejs` | database created on first init; mapped to `DB_NAME` |
| `MYSQL_USER` | `mysql`, `nodejs` | application account; mapped to `DB_USER` |
| `MYSQL_PASSWORD` | `mysql`, `nodejs` | application password; mapped to `DB_PASS` |

The renaming is deliberate and is the single most confusing part of the
configuration: the operator sets `MYSQL_*`, the application reads `DB_*`.

### Variables the API reads

Set on the `nodejs` service in `codebase/docker-compose.yml`:

| Variable | Value | Source |
|---|---|---|
| `DB_HOST` | `prototype-application-proxy-mysql` | literal, container name |
| `DB_PORT` | `3306` | literal |
| `DB_NAME` | — | `MYSQL_DATABASE` |
| `DB_USER` | — | `MYSQL_USER` |
| `DB_PASS` | — | `MYSQL_PASSWORD` |
| `NODE_ENV` | `production` | literal |

`DB_HOST` and the `DB_*` values in `codebase/apache/vhost.conf` and
`codebase/docker-compose.yml` must stay in step with the container names.

### phpMyAdmin

| Variable | Value | Note |
|---|---|---|
| `PMA_HOST` | `prototype-application-proxy-mysql` | must match the MySQL container name |
| `PMA_PORT` | `3306` | |
| `PMA_ABSOLUTE_URI` | `http://hkss13:2380/pma/` | **hardcoded host — see below** |
| `UPLOAD_LIMIT` | `64M` | |

`PMA_ABSOLUTE_URI` is what phpMyAdmin uses to build its own links and redirects.
If it does not match the URL you actually browse to, phpMyAdmin will redirect you
to a host that may not resolve. **Change this to your real address**, otherwise
the CI assertion on `/pma/` can fail on a redirect to `hkss13`.

## Network

| Property | Value |
|---|---|
| Name | `prototype_application_proxy` |
| Declared | `external: true` |
| Driver | `bridge` |
| Subnet | `172.70.0.0/24` |

Because it is external, Compose will not create it. It must exist before any
Compose command, on every machine and every CI runner.

## Container and image names

All prefixed `prototype-application-proxy`, all tagged `latest`.

| Compose service | Image | Container name | Internal port |
|---|---|---|---|
| `proxy` | `prototype-application-proxy:latest` | `prototype-application-proxy` | `2380:80` |
| `reactjs` | `prototype-application-proxy-reactjs:latest` | `prototype-application-proxy-reactjs` | `80` (expose) |
| `nodejs` | `prototype-application-proxy-nodejs:latest` | `prototype-application-proxy-nodejs` | `3000` (expose) |
| `mysql` | `mysql:8.0` | `prototype-application-proxy-mysql` | `3306` |
| `pma` | `phpmyadmin:5-apache` | `prototype-application-proxy-pma` | `80` (expose) |

`codebase/apache/vhost.conf` addresses three of these by name. Renaming a
container without updating the vhost produces a 502 from the proxy.

## Base images

| Service | Base | Notes |
|---|---|---|
| `proxy` | `httpd:2.4` | Debian layout; config under `/usr/local/apache2/` |
| `reactjs` | `node:20-alpine` build, `nginx:1.27-alpine` run | two stages |
| `nodejs` | `node:20-alpine` | `npm install --omit=dev` |
| `mysql` | `mysql:8.0` | |
| `pma` | `phpmyadmin:5-apache` | |

## Credential file

`codebase/apache/.htpasswd` is **tracked in git** — known debt. It is copied to
`/usr/local/apache2/conf/.htpasswd` at build time, so the image build fails if
the file is missing, and it must exist before `docker compose build`.

`htpasswd -c` truncates the file. Use it once, then never again.

## CI configuration

`.github/workflows/pipeline.yml`, triggered only on a push to `dev-001`.

| Job | Needs | Runner |
|---|---|---|
| `merge_dev_001_to_dev` | — | `ubuntu-latest` |
| `merge_dev_to_main` | `merge_dev_001_to_dev` | `ubuntu-latest` |
| `verify` | `merge_dev_to_main` | `ubuntu-latest`, `working-directory: codebase` |
| `pages` | both above, `if: always()` | `ubuntu-latest` |

### Required repository settings

| Setting | Why |
|---|---|
| Secret `GIT_PUSH_TOKEN` | fine-grained PAT, Contents: read+write; needed to push past branch protection, which `GITHUB_TOKEN` cannot |
| Branch protection bypass | the PAT's account must be allowed to bypass protection on `dev` and `main` |
| Pages source: **GitHub Actions** | otherwise `actions/deploy-pages` fails |

The `verify` job needs **no secrets** — see
[ADR-0006](ADR.md#adr-0006-substitute-configuration-from-the-environment-in-ci).
`concurrency: pipeline-dev-001` with `cancel-in-progress: false` prevents two
runs from interleaving their merges.

## Repository layout

| Path | Contents |
|---|---|
| `codebase/docker-compose.yml` | the whole runnable stack |
| `codebase/.env.example` | template; `codebase/.env` is generated and ignored |
| `codebase/{apache,mysql,nodejs,reactjs}/` | the four services |
| `docbase/` | all documentation |
| `.github/workflows/` | the single pipeline |

Compose must be invoked from `codebase/`, or given
`--project-directory codebase`, so it finds the environment file and resolves
build contexts relative to the Compose file.

## `.gitignore` patterns

| Pattern | Why it is written that way |
|---|---|
| `.env` | no slash, so it matches at any depth — still correct under `codebase/` |
| `**/mysql/data` | a pattern containing a slash is anchored to the `.gitignore`'s directory, so a bare `mysql/data` would stop matching once the path became `codebase/mysql/data` |
| `**/node_modules`, `**/build` | local build artefacts, not shipped |

## Related documents

[QuickStart.md](QuickStart.md) · [Architecture.md](Architecture.md) ·
[ADR.md](ADR.md) · [Schema.md](Schema.md)
