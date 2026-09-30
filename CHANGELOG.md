# Changelog

All notable changes to this project are documented here.
Format: [semver](https://semver.org/) — `major.minor.patch`.

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
