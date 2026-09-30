# Changelog

All notable changes to this project are documented here.
Format: [semver](https://semver.org/) — `major.minor.patch`.

## [1.5.0]

### Added

- **`AGENTS.md` gained a `## Diagrams` section**, making Mermaid the required
  notation for structure across the whole repository. It specifies the diagram
  type to pick per kind of relationship (`flowchart` for topology and job
  graphs, `sequenceDiagram` for request order and auth branches, `erDiagram`
  for schema, `stateDiagram-v2` for component state), forbids box-drawing
  characters and ASCII arrows in any `.md` file, and allows one exception: a
  short inline path inside a sentence is fine, a fenced block of ASCII art is
  not.

  Three worked examples are included as copyable templates, plus the syntax
  traps that produce silent or unhelpful failures — node ids are identifiers
  rather than labels, `end` is a reserved word that breaks an entire diagram,
  labels containing `: ( ) / -` must be quoted, `<br/>` is the only line break
  inside a label, `%%` is the comment syntax in every diagram type, ER attribute
  types must be a single word, and every `alt` / `else` / `loop` / `opt` needs a
  matching `end`. It also records that `%%{init: ...}%%` directives and custom
  themes must not be used, since GitHub's renderer ignores them and the diagram
  would then render differently for the author than for the reader.

### Changed

- `docbase/doc/Architecture.md` — the hand-drawn topology box diagram is now a
  `flowchart` with the Docker network as a subgraph, and the five-step prose
  request flow is now a `sequenceDiagram` whose `alt` / `else` branches show
  the authenticated and rejected paths. The two facts that the prose carried
  but the old diagram could not express — that the auth block is per-`<Location>`
  and so only `/reactjs` is actually protected, and that `ProxyPassReverse` is
  what makes phpMyAdmin redirects resolve through the proxy — are retained as
  prose beneath the diagram rather than dropped.
- `docbase/doc/ERD.md` — the ASCII `users 1 ──< items` sketch of the implied
  extension is now an `erDiagram`, labelled and noted as hypothetical so it
  cannot be misread as current schema.
- `README.md` — the ASCII routing summary is now a `flowchart`.

### Verified

- All 10 Mermaid blocks across the repository parse with Mermaid's own parser
  (v11, under jsdom), not just by eye.
- No box-drawing characters remain outside the AGENTS.md rule that names them.
- All relative links and heading anchors still resolve; TOCTREE coverage and
  ignore rules unchanged.

## [1.4.0]

### Added

- `docbase/doc/Configuration&Settings.md` — the configuration reference: every
  environment variable and its consumer, the `MYSQL_*` → `DB_*` renaming, the
  `MYSQL_*` → `DB_*` mapping table, phpMyAdmin's settings, the network definition,
  container and image names, base images, the credential file, the CI job and
  permission matrix, required repository settings, the repository layout, the
  `.gitignore` patterns with the reasoning behind the non-obvious ones, and the
  Apache modules enabled at build time. Includes the reasoning for each entry
  that would otherwise be guesswork, such as why `PMA_ABSOLUTE_URI` must match
  the real hostname and why `**/mysql/data` is required.

### Changed

- **`docbase/doc/CRM.md` is now a Cross-Reference Matrix.** In 1.3.0 it was
  written as a configuration reference, which duplicated what
  `Configuration&Settings.md` now covers. It has been rewritten to answer "if I
  change X, what else must I update?", tracing every element across the
  dimensions it touches:
  - **A** component — element × requirement × image × port × config × doc × test × known issue
  - **B** route — route × backend × auth block × CI assertion × whether that is correct
  - **C** delivery — job × what it consumes and produces × runner × failure modes
  - **D** configuration — variable × set by × read by × renamed to × CI value
  - **E** requirement-to-code index
  - **F** document matrix — which document owns which concern
  - **G** known-issue index — each defect once, with its trace and fix

  Matrix B marks three rows as incorrect against the project's own goals, and
  matrix G consolidates all nine known defects so each appears once.
  The document ends with maintenance instructions naming which matrices must be
  updated for which kind of change.
- `TOCTREE.md`, `README.md` and `AGENTS.md` updated with the new document and
  the corrected description of `CRM.md`.
- Inbound links in `API.md`, `Architecture.md`, `ProjectCharter.md`,
  `QuickStart.md`, `RTM.md` and `Schema.md` repointed to
  `Configuration&Settings.md` where they referred to configuration.

## [1.3.0]

### Added

- `docbase/` — the documentation tree, satisfying per-change checklist item 2,
  which had been unsatisfiable since `CHANGELOG.md` was introduced.
  - `docbase/TOCTREE.md` — index; every document must be listed here.
  - `docbase/doc/ProjectCharter.md` — purpose, scope, constraints, success
    criteria, risks.
  - `docbase/doc/PRD.md` — functional and non-functional requirements with
    current conformance, including the two unmet requirements.
  - `docbase/doc/SRS.md` — numbered requirements, each naming what verifies it;
    "unverified" is recorded explicitly rather than left blank.
  - `docbase/doc/ADR.md` — eight decision records covering proxy choice, the
    external network, the static frontend build, workflow consolidation, partial
    auth coverage, environment substitution, GitHub Pages, and this layout.
  - `docbase/doc/Architecture.md` — topology, request flow, start ordering, and
    the known defects.
  - `docbase/doc/API.md` — HTTP surface, authentication matrix, per-endpoint
    behaviour including the unhandled rejection on `/api/items`.
  - `docbase/doc/Schema.md` and `docbase/doc/ERD.md` — the `items` table and the
    access paths to it.
  - `docbase/doc/QuickStart.md` — clean-machine setup, verification commands,
    and a troubleshooting table.
  - `docbase/doc/RTM.md` — requirement → implementation → verification matrix,
    with coverage counts and the work each gap implies.
  - `docbase/doc/CRM.md` — every variable, container name, base image, CI
    setting and `.gitignore` pattern, with the reasoning behind the non-obvious
    ones.

### Changed

- **Moved all runnable content under `codebase/`.** `apache/`, `mysql/`,
  `nodejs/`, `reactjs/`, `docker-compose.yml` and `.env.example` were relocated
  with `git mv`, so all 16 files are recorded as renames and history is intact.
  `codebase/` is now the single root of everything executable; nothing runnable
  remains at the repository root or may be added under `docbase/`.
- **Repointed the CI pipeline at `codebase/`.** The `verify` job now sets
  `working-directory: codebase`, so `docker compose` resolves
  `codebase/docker-compose.yml` and the relative `./apache` build contexts. It
  also makes the `htpasswd` step's `apache/.htpasswd` path resolve to
  `codebase/apache/.htpasswd`. Without this the pipeline would have failed.
- `.gitignore` rewritten with the reasons inline: `mysql/data` became
  `**/mysql/data` because a pattern containing a slash is anchored to the
  `.gitignore`'s own directory and would have silently stopped matching
  `codebase/mysql/data`; `**/node_modules` and `**/build` were added so local
  build artefacts cannot be committed.
- `README.md` rewritten: new layout, `codebase/`-prefixed commands, a document
  table, and a working link to `docbase/TOCTREE.md` (previously a broken link).
- `AGENTS.md` — the "Layout drift" section is replaced by a description of the
  layout that now exists, including the two things that break when content moves
  across the `codebase/` boundary.

### Notes

- `codebase/docker-compose.yml` itself needed **no** changes. Its `build:` paths
  and bind mounts are resolved relative to the Compose file, so they followed the
  move unchanged.
- `CHANGELOG.md` entries for 1.0.0–1.2.0 still describe paths at the repository
  root. They are left as written, because a changelog records what was true at
  the time.
- Nothing in `codebase/` was modified beyond relocation, so the verification
  result from 1.2.0 still applies. It has not been re-run against this tree
  locally, since no Docker daemon is available in the authoring environment.

## [1.2.0]

### Added

- `.github/workflows/pipeline.yml` — a `pages` job that renders a static status
  page and deploys it with `actions/deploy-pages`, reporting the verification
  result, the merged `main` SHA and the endpoints CI asserts. Runs
  `if: always()` so a failed verification publishes a red page instead of leaving
  the previous green one up.

### Changed

- **Consolidated to a single workflow.** `auto-merge.yml` and `ci.yml` are removed
  and replaced by `pipeline.yml`, triggered only on a push to `dev-001`, with all
  four jobs chained by `needs:`:
  `merge_dev_001_to_dev -> merge_dev_to_main -> verify -> pages`.
  The merges previously relied on a push to `dev`/`main` re-triggering a workflow.
  Chaining them means one run covers the whole promotion, so it reports a single
  status instead of three, and a `push:` trigger on `dev`/`main` would now
  double-merge. The old `if: github.ref == ...` guards were dropped since the run's
  ref is `dev-001` for every job.
- `merge_dev_to_main` now checks out `dev` (already updated by job 1) rather than
  the triggering commit, and `verify` checks out `main` so it tests the state that
  would be released, passing that SHA to `pages` as a job output.
- Workflow-level `permissions` widened to `contents: write` (merges),
  `pages: write` + `id-token: write` (Pages).
- `README.md` and `AGENTS.md` updated for the single-workflow layout, the status
  page, and the Pages setup step (Settings → Pages → Source: GitHub Actions).

### Required setup

- Repository secret `GIT_PUSH_TOKEN` is still required for branch protection.
- GitHub Pages must be set to source **GitHub Actions**, or `deploy-pages` fails.

## [1.1.0]

### Added

- `.github/workflows/ci.yml` — completes the chain
  `dev-001 -> dev -> main -> docker build & up -d -> test connectivity & auth`.
  Runs on a throwaway `ubuntu-latest` runner, creates the external Docker network,
  appends a temporary `ci-user` to `apache/.htpasswd` (the image `COPY`s that
  file, so it must exist before the build), builds and starts the stack, then
  asserts `/nodejs/api/health` and `/pma/` return `200` and `/reactjs/` returns
  `401` anonymously but `200` when authenticated. Tears everything down
  afterwards. Requires no repository secrets.

### Changed

- `README.md` — removed the stale `.gitlab-ci.yml` section, which described a
  GitLab pipeline that does not exist and embedded its YAML inline. Replaced with
  the real GitHub Actions chain, an endpoint/auth table, and a pointer to
  `docbase/TOCTREE.md`.
- `AGENTS.md` — documents the two-workflow CI model and the reason CI needs no
  secrets.

### Notes

- Deployment to a real host is explicitly **not** part of CI. GitHub Pages cannot
  run containers, and a cloud VM would be CD, so neither was added.
- `ci.yml` asserts that `/pma/` and `/nodejs/` are reachable **anonymously**. That
  is the current, incorrect behaviour; the assertion makes the gap explicit and
  will need flipping to `401` when auth is extended to those paths.

## [1.0.0]

### Added

- `AGENTS.md` — agent-facing instructions: per-change checklist, target
  `codebase/` + `docbase/` layout, branch/CI flow, run order, and the known
  operational gotchas (external network, `mysql/data` bind mount, missing
  lockfiles, `PMA_ABSOLUTE_URI`, partial auth coverage).

### Known issues (unchanged, documented in `AGENTS.md`)

- `codebase/` and `docbase/` do not exist yet; services still live at repo root.
- Basic auth covers only `/reactjs`; `/pma` and `/nodejs` are unauthenticated.
- Only one `.htpasswd` user (`admin`) exists; the 2+ user requirement is unmet,
  and `.htpasswd` is tracked in git.
- `reactjs/src/index.js` calls `/api/health`, which Apache does not proxy.
- CRA emits absolute `/static/...` asset paths that 404 under `/reactjs`.
- `README.md` documents a `.gitlab-ci.yml` pipeline that does not exist; the real
  CI is `.github/workflows/auto-merge.yml`.
