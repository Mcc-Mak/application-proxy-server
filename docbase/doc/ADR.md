# Architecture Decision Records

Each record states the context, the decision, and what it costs. Status is
`Accepted`, `Proposed`, `Superseded` or `Rejected`.

---

## ADR-0001 — Apache httpd 2.4 as the reverse proxy

**Status:** Accepted

**Context.** The gateway must terminate HTTP, route by path prefix, and perform
HTTP basic authentication. A front-end web server is the obvious fit.

**Decision.** Use the `httpd:2.4` image, Debian-based, with the required modules
uncommented in `httpd.conf` at build time and a virtual host wired in via an
appended `Include` directive.

**Consequences.** Configuration lives under `/usr/local/apache2/`, not
`/etc/apache2/`. There is no default vhost to remove, and `Listen` needs no
adjustment. Modules are enabled by `sed` because the base image ships them
commented out. An alternative considered was nginx, but Apache's `AuthUserFile`
makes basic auth a first-class, well-understood path.

---

## ADR-0002 — A single external Docker network

**Status:** Accepted

**Context.** Containers must reach each other by name, and the proxy must reach
all three applications.

**Decision.** Declare `prototype_application_proxy` as `external: true` in the
Compose file rather than letting Compose create it. Subnet `172.70.0.0/24`.

**Consequences.** Compose will not create the network and fails if it is missing,
so every fresh machine and every CI runner must create it first. This is a
deliberate trade: an explicit network step is a small cost that makes the network
definition visible and prevents Compose from inventing a name and subnet that
might collide with an existing one. CI performs this step before building.

---

## ADR-0003 — Static build for the React frontend

**Status:** Accepted

**Context.** The frontend is a single page with no server-side logic.

**Decision.** Build with `react-scripts` in a Node stage, then copy the static
output into `nginx:1.27-alpine`. No Node runtime in the served image.

**Consequences.** The served artefact is small and has no runtime attack surface.
The trade-off is a two-stage build and a build that is slower than serving
prebuilt files. Note the known defect recorded in [Architecture.md](Architecture.md#known-issues):
the build emits absolute asset paths that do not resolve under the `/reactjs`
prefix.

---

## ADR-0004 — Promote with a single chained workflow

**Status:** Accepted

**Context.** The branch model is `dev-001` → `dev` → `main`, and the merged result
should be verified before anyone relies on it.

**Decision.** One workflow file, triggered only on a push to `dev-001`, with the
promotion expressed as job dependencies rather than as separate triggered runs.

**Consequences.** The whole promotion is one run with one status, instead of
three runs that can be seen independently. This is also what removes the previous
hard dependency on a token that can trigger further workflow runs. The remaining
token is needed only to bypass branch protection, and it is optional: the merge
jobs fall back to the built-in `GITHUB_TOKEN` when no `GIT_PUSH_TOKEN` is
configured, so an unprotected repository needs no secret at all. The cost is
that adding a `push:` trigger on `dev` or `main` would double-merge, so triggers
must stay minimal.

---

## ADR-0005 — Record partial authentication coverage

**Status:** Accepted (documents a gap, not a design)

**Context.** The project's goal is a proxy that safeguards everything behind
authentication for two or more users. Today, only `/reactjs` is protected;
`/pma` and `/nodejs` are reachable anonymously.

**Decision.** Do not silently paper over this. CI asserts the current behaviour
explicitly, and the asymmetry is documented rather than hidden.

**Consequences.** The CI suite encodes today's incorrect behaviour, which means
it must be deliberately updated — not "fixed" — when authentication is extended
to the other paths. The alternative, asserting the desired behaviour immediately,
would have produced a permanently red pipeline on a known gap and trained everyone
to ignore it. Closing the gap is tracked as SRS-F-10 and SRS-S-04.

---

## ADR-0006 — Substitute configuration from the environment in CI

**Status:** Accepted

**Context.** Compose reads variables from a `.env` file, which must not be
committed. Verification should not require anyone to configure secrets.

**Decision.** Set the four `MYSQL_*` variables in the workflow's `env:` block.
Compose substitutes them from the process environment, so no `.env` file is
written and the pipeline needs no repository secrets.

**Consequences.** Verification runs with no setup. The consequence to remember is
that the values are throwaway: the database is destroyed at the end of the job, so
nothing persistent is lost. For a real deployment a `.env` on the host, or
injected secrets, would be required instead.

---

## ADR-0007 — GitHub Pages for status only, never for hosting

**Status:** Accepted

**Context.** There was a request to deploy the containers to GitHub Pages.

**Decision.** Decline. GitHub Pages serves static files and has no container
runtime, so it can never run this stack. Use it to publish a status page
reporting what the pipeline verified, and say so plainly on the page.

**Consequences.** The published page describes verification results rather than a
live deployment, and includes explicit wording that nothing is hosted there.
Terraform was also considered and rejected for the same class of reason: it
provisions infrastructure, it does not host anything.

---

## ADR-0008 — Document tree under `docbase/`, runnable code under `codebase/`

**Status:** Accepted

**Context.** The repository mixed runnable content and documentation at the root.

**Decision.** `codebase/` is the single root of everything executable — the
Compose file, the environment files and the four services. `docbase/` holds all
documentation.

**Consequences.** `.gitignore` patterns needed care: `mysql/data` contains a
slash, which anchors it to the repository root, so it became `**/mysql/data`.
Compose must be invoked from inside `codebase/` so it finds the environment file
and resolves build contexts relative to the Compose file. CI does this with a
job-level working directory.

---

## Related documents

[Architecture.md](Architecture.md) · [ProjectCharter.md](ProjectCharter.md)
