# Cross-Reference Matrix

Where every element of the system is traced across all the other dimensions:
which requirement it satisfies, which file configures it, which document
explains it, what verifies it, and what is still wrong with it.

Use this to answer "if I change X, what else must I update?" — that is the
question it exists to make answerable.

Companion documents: [Configuration&Settings.md](Configuration&Settings.md) for
values, [RTM.md](RTM.md) for full requirement-level detail.

## A. Component matrix

| Element | Requirement | Image / container | Port | Configured in | Documented in | Verified by | Known issue |
|---|---|---|---|---|---|---|---|
| `proxy` | SRS-F-01, SRS-S-03 | `prototype-application-proxy:latest` | `2380:80` | `codebase/apache/vhost.conf` | [Architecture](Architecture.md) | CI `verify` | none |
| `reactjs` | SRS-F-02, SRS-F-05, SRS-F-06 | `…-reactjs:latest` | `80` expose | `codebase/apache/vhost.conf` | [Architecture](Architecture.md) | CI `verify` | assets 404 under prefix |
| `nodejs` | SRS-F-03, SRS-F-07, SRS-F-08 | `…-nodejs:latest` | `3000` expose | `codebase/nodejs/server.js` | [API](API.md) | CI `verify` | no `.dockerignore`; unhandled rejection |
| `mysql` | SRS-F-11 | `mysql:8.0` | `3306` | `codebase/mysql/init.sql` | [Schema](Schema.md) | CI `verify` | `init.sql` runs once only |
| `pma` | SRS-F-04 | `phpmyadmin:5-apache` | `80` expose | `codebase/docker-compose.yml` | [Architecture](Architecture.md) | CI `verify` | `PMA_ABSOLUTE_URI` hardcoded |
| network | SRS-O-01 | `prototype_application_proxy` | — | `codebase/docker-compose.yml` | [CRM-B](#b-route-matrix) | CI `verify` | `external: true`, must pre-exist |
| credentials | SRS-F-10, SRS-S-01 | — | — | `codebase/apache/.htpasswd` | [Configuration](Configuration&Settings.md) | CI `verify` | only 1 user; tracked in git |
| environment | SRS-O-05 | — | — | `codebase/.env` | [Configuration](Configuration&Settings.md) | CI `verify` | uncommitted; expands empty if missing |
| pipeline | SRS-O-03, SRS-O-06, SRS-O-07 | `ubuntu-latest` | — | `.github/workflows/pipeline.yml` | [CRM-C](#c-delivery-matrix) | itself | needs `GIT_PUSH_TOKEN` |

## B. Route matrix

Each published path, who can reach it, and how that is proven.

| Route | Backend | Auth block | CI assertion | Correct? | Requirement |
|---|---|---|---|---|---|
| `/` | — | — | manual | yes | SRS-F-09 |
| `/reactjs/` | `…-reactjs:80` | `<Location /reactjs>` | `401` anon, `200` auth | yes | SRS-F-05, SRS-F-06 |
| `/reactjs/static/*` | — | — | **none** | **no** — 404s | — |
| `/reactjs/` → `/api/health` | — | — | **none** | **no** — unrouted | — |
| `/nodejs/api/health` | `…-nodejs:3000` | **none** | `200` anon | **no** — should be authed | SRS-S-04 |
| `/nodejs/api/items` | `…-nodejs:3000` | **none** | manual | **no** — should be authed | SRS-S-04 |
| `/pma/` | `…-pma:80` | **none** | `200` anon | **no** — should be authed | SRS-S-04 |

The three rows marked **no** are the reason CI asserts current behaviour rather
than desired behaviour: encoding the gap makes it visible, and each must be
deliberately flipped when auth is extended. See
[ADR-0005](ADR.md#adr-0005-record-partial-authentication-coverage).

## C. Delivery matrix

Each stage of the pipeline, what it consumes and produces.

| # | Job | Consumes | Produces | Runs on | Fails if |
|---|---|---|---|---|---|
| 1 | `merge_dev_001_to_dev` | `dev-001`, `dev` | `dev` | `ubuntu-latest` | merge conflict; no PAT |
| 2 | `merge_dev_to_main` | `dev` (post-merge) | `main` | `ubuntu-latest` | merge conflict; no PAT |
| 3 | `verify` | `main` | pass/fail | `ubuntu-latest`, cwd `codebase/` | build, start, or assertion |
| 4 | `pages` | results of 2 and 3 | status page | `ubuntu-latest` | Pages not configured |

Job 2 consumes `dev` *after* job 1 pushed, not the triggering ref. Job 3
deliberately verifies `main`, not `dev-001`, so it tests the state that would be
released.

## D. Configuration matrix

Which variable is set where and who reads it. Full values in
[Configuration&Settings.md](Configuration&Settings.md).

| Variable | Set by | Read by | Renamed to | CI value |
|---|---|---|---|---|
| `MYSQL_ROOT_PASSWORD` | `codebase/.env` | `mysql`, healthcheck | — | throwaway |
| `MYSQL_DATABASE` | `codebase/.env` | `mysql` | `DB_NAME` | `prototype` |
| `MYSQL_USER` | `codebase/.env` | `mysql` | `DB_USER` | `ci` |
| `MYSQL_PASSWORD` | `codebase/.env` | `mysql` | `DB_PASS` | throwaway |
| `PMA_HOST` | `docker-compose.yml` | `pma` | — | same as `DB_HOST` |
| `PMA_ABSOLUTE_URI` | `docker-compose.yml` | `pma` | — | **hardcoded** `hkss13` |
| `GIT_PUSH_TOKEN` | repo secret | jobs 1, 2 | — | **absent by design** |
| `CI_HTPASSWD_*` | workflow `env` | job 3 | — | throwaway |

## E. Requirement-to-code index

Compact lookup. `RTM.md` carries verification detail and status.

| Prefix | Area | Implementation |
|---|---|---|
| SRS-F-01…03 | ingress and routing | `codebase/apache/vhost.conf` |
| SRS-F-04…06 | authentication | `<Location /reactjs>`, `codebase/apache/.htpasswd` |
| SRS-F-07…08 | API behaviour | `codebase/nodejs/server.js` |
| SRS-F-09 | root redirect | `RedirectMatch` in `vhost.conf` |
| SRS-F-10 | user count | `codebase/apache/.htpasswd` — **not met** |
| SRS-F-11 | start ordering | `depends_on: service_healthy` |
| SRS-S-01…05 | security | `vhost.conf`, Compose `expose:` |
| SRS-O-01…07 | operations | `.github/workflows/pipeline.yml` |
| SRS-D-01…05 | documentation | `AGENTS.md` checklist, review only |
| SRS-C-01…04 | constraints | repository layout |

## F. Document matrix

Which document owns which concern, so updates land in the right file.

| Concern | Document | Not documented in |
|---|---|---|
| Why the project exists, scope, risks | [ProjectCharter](ProjectCharter.md) | — |
| User-facing requirements, conformance | [PRD](PRD.md) | SRS |
| Numbered testable requirements | [SRS](SRS.md) | PRD |
| Decisions and their costs | [ADR](ADR.md) | Architecture |
| Topology, request flow, known issues | [Architecture](Architecture.md) | — |
| HTTP surface, auth matrix | [API](API.md) | CRM (route view) |
| Tables and columns | [Schema](Schema.md) | ERD |
| Entities and relationships | [ERD](ERD.md) | Schema |
| Setup and troubleshooting | [QuickStart](QuickStart.md) | README |
| Requirement → code → test | [RTM](RTM.md) | CRM (index) |
| Variables, names, settings | [Configuration&Settings](Configuration&Settings.md) | CRM (matrix) |
| Agent conventions and gotchas | `AGENTS.md` | docbase |
| Change history | `CHANGELOG.md` | — |

## G. Known-issue index

Consolidated so each defect appears once with its trace.

| Defect | Element | Fix | Traced in |
|---|---|---|---|
| Static assets 404 under `/reactjs` | `reactjs` | set `"homepage"` in `package.json` | [API](API.md#routing), [Architecture](Architecture.md#known-issues) |
| Health panel never populates | `reactjs` | fetch `/nodejs/api/health` | [API](API.md#routing) |
| `PMA_ABSOLUTE_URI` hardcoded | `pma` | set to real hostname | [Configuration](Configuration&Settings.md#phpmyadmin) |
| One user only | credentials | add a second with `htpasswd` | [RTM](RTM.md#gaps-and-the-work-they-imply) |
| Auth not on every path | `proxy` | add `<Location>` blocks | [ADR-0005](ADR.md#adr-0005-record-partial-authentication-coverage) |
| `.htpasswd` tracked in git | credentials | untrack, supply at deploy | [Configuration](Configuration&Settings.md#credential-file) |
| Builds not reproducible | all three images | commit both lockfiles | [Architecture](Architecture.md#known-issues) |
| No `.dockerignore` in `nodejs` | `nodejs` | add one | [Architecture](Architecture.md#known-issues) |
| `init.sql` runs once only | `mysql` | wipe `codebase/mysql/data` | [Schema](Schema.md#reapplying-schema-changes) |

## Maintaining this matrix

Update it in the same commit as whatever changed it. Specifically:

- Adding or removing a service → matrices A, B, C.
- Adding or renaming a variable → matrix D and
  [Configuration&Settings.md](Configuration&Settings.md).
- Changing a route or its auth → matrix B, and **flip the matching CI
  assertion deliberately**.
- Fixing a defect → remove its row from matrix G.
- Adding a document → matrix F and [TOCTREE.md](../TOCTREE.md).

If a cell cannot be filled honestly, that is the finding. `—` under
"Verified by" means nothing checks it; "manual" means a human must.

## Related documents

[Configuration&Settings.md](Configuration&Settings.md) · [RTM.md](RTM.md) ·
[SRS.md](SRS.md) · [ADR.md](ADR.md)
