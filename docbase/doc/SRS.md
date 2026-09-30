# Software Requirements

Numbered, testable requirements. "Verified by" names the mechanism that checks
the requirement; `—` means nothing checks it automatically, which is itself worth
noting. See [RTM.md](RTM.md) for requirement-to-test mapping.

## Functional

| ID | Requirement | Verified by |
|---|---|---|
| SRS-F-01 | The proxy publishes host port 2380 and nothing else does | manual |
| SRS-F-02 | `/reactjs` routes to the `reactjs` container | CI (`200` authenticated) |
| SRS-F-03 | `/nodejs` routes to the `nodejs` container on port 3000 | CI (`200` on `/nodejs/api/health`) |
| SRS-F-04 | `/pma` routes to the `pma` container | CI (`200`) |
| SRS-F-05 | An unauthenticated request to `/reactjs` returns `401` | CI |
| SRS-F-06 | A request to `/reactjs` with valid credentials returns `200` | CI |
| SRS-F-07 | The API performs a real database query and reports the result | CI (`/nodejs/api/health` body) |
| SRS-F-08 | The API returns the contents of the `items` table | manual |
| SRS-F-09 | `/` redirects to `/reactjs/` | manual |
| SRS-F-10 | At least two users can authenticate | **unverified** — only one exists |
| SRS-F-11 | The stack starts only after MySQL is healthy | Compose `depends_on: service_healthy` |

## Security

| ID | Requirement | Verified by |
|---|---|---|
| SRS-S-01 | Credentials are stored in an Apache `AuthUserFile` | manual |
| SRS-S-02 | Passwords are not stored in plaintext | manual (`htpasswd -bB` writes a hash) |
| SRS-S-03 | Application containers are not directly reachable from the host | manual (`expose:` only) |
| SRS-S-04 | Every published path is authenticated | **not met** — see [ADR-0005](ADR.md#adr-0005-record-partial-authentication-coverage) |
| SRS-S-05 | CI never commits a credential | manual (throwaway user is generated in-runner) |

## Operational

| ID | Requirement | Verified by |
|---|---|---|
| SRS-O-01 | The external Docker network is created if absent | CI |
| SRS-O-02 | Images build from a clean checkout with no preinstalled dependencies | CI |
| SRS-O-03 | A push to `dev-001` promotes through `dev` to `main` in one run | CI |
| SRS-O-04 | Verification runs against the merged `main`, not the source branch | CI |
| SRS-O-05 | The stack is destroyed after verification | CI (`docker compose down -v`) |
| SRS-O-06 | A failed verification is reported, not masked | CI (status page publishes on failure) |
| SRS-O-07 | Concurrent pipeline runs cannot interleave their merges | `concurrency` group |

## Documentation

| ID | Requirement | Verified by |
|---|---|---|
| SRS-D-01 | Every change updates the affected service code | review |
| SRS-D-02 | Every change updates this document tree | review |
| SRS-D-03 | The README references the documentation root | review |
| SRS-D-04 | Every change adds a `major.minor.patch` changelog entry | review |
| SRS-D-05 | Commits land on `dev-001` with the version as subject | review |

## Constraints

| ID | Constraint |
|---|---|
| SRS-C-01 | All runnable content lives under `codebase/`, all documentation under `docbase/` |
| SRS-C-02 | Container and image names are prefixed `prototype-application-proxy` |
| SRS-C-03 | No host port other than 2380 is published |
| SRS-C-04 | No unit test, lint or typecheck infrastructure exists; verification is a smoke test |

## Related documents

[PRD.md](PRD.md) · [Architecture.md](Architecture.md) · [RTM.md](RTM.md)
