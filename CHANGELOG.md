# Changelog

All notable changes to this project are documented here.
Format: [semver](https://semver.org/) — `major.minor.patch`.

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
