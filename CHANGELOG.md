# Changelog

All notable changes to this project are documented here.
Format: [semver](https://semver.org/) — `major.minor.patch`.

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
