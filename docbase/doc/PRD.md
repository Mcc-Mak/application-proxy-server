# Product Requirements

## Problem statement

Four containers — a React frontend, a Node API, phpMyAdmin and MySQL — need to be
reachable by a user. Exposing each one directly would mean four published ports
and four independent authentication decisions. The proxy exists so that
authentication is decided exactly once, in one file.

## Users

| User | Needs | Path |
|---|---|---|
| Application user | View the React frontend and the API behind it | `/reactjs/`, `/nodejs/api/*` |
| Database administrator | Inspect the database through a GUI | `/pma/` |
| Operator | Confirm the stack is up and which version is deployed | CI run, status page |

## Functional requirements

**FR-1 — Single ingress.** All application traffic reaches the cluster through
one published host port. No application container publishes a host port.

**FR-2 — Path routing.** The proxy routes three path prefixes to three
backends, each addressed by container name on the internal network.

**FR-3 — Authentication.** Requests to `/reactjs` require valid credentials. An
unauthenticated request is rejected with `401`; an authenticated request is
served.

**FR-4 — Multiple users.** At least two distinct users must be able to
authenticate.

**FR-5 — Database connectivity.** The API returns a successful database
round-trip, proving the API and MySQL are wired correctly.

**FR-6 — Automatic promotion.** A push to `dev-001` is merged to `dev`, then to
`main`, then verified, in a single CI run.

## Non-functional requirements

**NFR-1 — One workflow.** The pipeline is a single workflow file with a single
trigger, so the whole promotion is visible as one run.

**NFR-2 — No secrets required for verification.** CI substitutes configuration
from the process environment and uses an ephemeral database. Nothing sensitive is
required to run the pipeline.

**NFR-3 — No credential leakage in CI logs.** The throwaway CI user is generated
inside the runner and never committed.

**NFR-4 — Honest reporting.** Any published status artefact must state what was
actually verified. Static hosting cannot run containers and must not imply that it
does.

## Current conformance

| Req | Status | Evidence |
|---|---|---|
| FR-1 | Met | Only `proxy` has `ports:`; the rest use `expose:` |
| FR-2 | Met | `codebase/apache/vhost.conf` |
| FR-3 | Met | Asserted by CI: `401` anonymous, `200` authenticated |
| FR-4 | **Not met** | Only one user, `admin`, exists |
| FR-5 | Met | Asserted by CI against `/nodejs/api/health` |
| FR-6 | Met | `.github/workflows/pipeline.yml` |

FR-4 is the significant gap. It is also currently compounded by
[ADR-0005](ADR.md#adr-0005-record-partial-authentication-coverage), which
documents that authentication covers only one of three routes.

## Known issues

- The React health panel requests `/api/health`, which the proxy does not route.
  See [Architecture.md](Architecture.md#known-issues).
- `/pma` and `/nodejs` are reachable without credentials. This is the behaviour CI
  asserts today, precisely so the gap is visible rather than assumed.

## Related documents

[ProjectCharter.md](ProjectCharter.md) · [SRS.md](SRS.md) · [API.md](API.md) ·
[RTM.md](RTM.md)
