# Project Charter

**Project:** Application Proxy Server
**Status:** Prototype
**Baseline version:** 1.0.0

## Purpose

Demonstrate that a single reverse proxy can act as the sole ingress point for a
small cluster of application containers, providing one authenticated entry point
instead of exposing each service directly.

## Problem

Running several application containers normally means either publishing a port
per service or fronting them with a hand-assembled proxy. Both approaches tend to
produce the same failure: the proxy ends up authenticating some paths and not
others, so the "protected" perimeter is only as strong as the least careful
`<Location>` block.

This prototype makes the proxy the only ingress and treats the authentication
boundary as the primary deliverable rather than an afterthought.

## Scope

In scope:

- One Apache reverse proxy as the sole published endpoint.
- A React single-page application, a Node.js API, phpMyAdmin and MySQL behind it.
- HTTP basic authentication with two or more users.
- A CI pipeline that promotes `dev-001` ??`dev` ??`main` and verifies each merge.

Explicitly **out of scope** for the prototype:

- Deployment to a real host. This is CD, and is deliberately absent.
- TLS termination. The proxy listens on plain HTTP on port 2380.
- Horizontal scaling, multi-tenancy, or any form of user management UI.
- Session handling. Basic auth is stateless; every request re-authenticates.

## Constraints

| Constraint | Consequence |
|---|---|
| Prototype, not production | Credentials in git are tolerated as known debt, not as a design choice |
| No application server may publish a host port | All traffic must traverse the proxy |
| `mysql` is reached only by `nodejs` and `pma` | The API is the only programmatic path to data |
| No test framework exists in any service | Verification is a smoke test in CI, not a test suite |

## Success criteria

1. A single published port reaches all three application paths.
2. `/reactjs` returns `401` without credentials and `200` with valid ones.
3. At least two users exist in the credential file.
4. The Node API returns a successful database round-trip.
5. A push to `dev-001` results in a merge to `dev`, a merge to `main`, and a
   verification run, all within a single CI run.

Criteria 2 and 4 are asserted automatically by CI. Criteria 1, 3 and 5 are
demonstrable but not yet machine-checked in full.

## Risks

| Risk | Mitigation |
|---|---|
| Authentication coverage drifts out of sync with routes | CI asserts the current per-path auth state explicitly, including the paths that are unprotected |
| Proxy configuration silently diverges from container names | Container and image names are centralised in `codebase/docker-compose.yml` and referenced by name in `codebase/apache/vhost.conf`; both are documented in [Configuration&Settings.md](Configuration&Settings.md) |
| Build is not reproducible | Recorded as known debt: neither `package-lock.json` is committed |

## Related documents

[PRD.md](PRD.md) 繚 [SRS.md](SRS.md) 繚 [ADR.md](ADR.md) 繚
[Architecture.md](Architecture.md)
