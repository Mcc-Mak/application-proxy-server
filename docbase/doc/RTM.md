# Requirements Traceability Matrix

Maps each requirement in [SRS.md](SRS.md) to the code that implements it and the
mechanism that verifies it. `? under "Verified by" means nothing checks the
requirement automatically, which is recorded rather than hidden.

| Requirement | Implemented in | Verified by | Status |
|---|---|---|---|
| SRS-F-01 | `codebase/docker-compose.yml` (`ports:` on `proxy` only) | manual | met |
| SRS-F-02 | `codebase/apache/vhost.conf` | CI `verify` | met |
| SRS-F-03 | `codebase/apache/vhost.conf` | CI `verify` | met |
| SRS-F-04 | `codebase/apache/vhost.conf` | CI `verify` | met |
| SRS-F-05 | `<Location /reactjs>` in `vhost.conf` | CI `verify` | met |
| SRS-F-06 | same, against `ci-user` | CI `verify` | met |
| SRS-F-07 | `codebase/nodejs/server.js` `/api/health` | CI `verify` | met |
| SRS-F-08 | `codebase/nodejs/server.js` `/api/items` | manual | met |
| SRS-F-09 | `RedirectMatch` in `vhost.conf` | manual | met |
| SRS-F-10 | `codebase/apache/.htpasswd` | ??| **not met** |
| SRS-F-11 | `depends_on: service_healthy` in Compose | implicit in `up` | met |
| SRS-S-01 | `AuthUserFile` in `vhost.conf` | manual | met |
| SRS-S-02 | `htpasswd` hashing | manual | met |
| SRS-S-03 | `expose:` on all non-proxy services | manual | met |
| SRS-S-04 | `vhost.conf` | CI records it as unmet | **not met** |
| SRS-S-05 | `pipeline.yml` `verify` job | manual | met |
| SRS-O-01 | `pipeline.yml` network step | CI | met |
| SRS-O-02 | Dockerfiles, `docker compose build` | CI | met |
| SRS-O-03 | `pipeline.yml` merge jobs | CI | met |
| SRS-O-04 | `verify` checks out `main` | CI | met |
| SRS-O-05 | `verify` teardown step | CI | met |
| SRS-O-06 | `pages` job with `if: always()` | CI | met |
| SRS-O-07 | `concurrency: pipeline-dev-001` | CI | met |
| SRS-D-01 | ??| review | process |
| SRS-D-02 | `docbase/` | review | process |
| SRS-D-03 | `README.md` | review | process |
| SRS-D-04 | `CHANGELOG.md` | review | process |
| SRS-D-05 | branch policy | review | process |
| SRS-C-01 | repository layout | review | met |
| SRS-C-02 | `codebase/docker-compose.yml` | manual | met |
| SRS-C-03 | `codebase/docker-compose.yml` | manual | met |
| SRS-C-04 | whole repository | ??| acknowledged |

## Coverage

| | Count |
|---|---|
| Requirements met | 20 |
| Requirements not met | 2 (SRS-F-10, SRS-S-04) |
| Process obligations, verified by review | 5 |
| Acknowledged, nothing to verify | 1 (SRS-C-04) |
| Verified automatically by CI | 14 |

## Gaps and the work they imply

**SRS-F-10 ??fewer than two users.** Add at least one more entry:

```shell
htpasswd codebase/apache/.htpasswd user2
```

Note that the file is tracked in git, so this commits a credential hash. Resolving
that properly means untracking the file and supplying it at deploy time; see
[ADR-0001](ADR.md) context and the debt note in [Configuration&Settings.md](Configuration&Settings.md).

**SRS-S-04 ??authentication does not cover every published path.** Extend
`vhost.conf` with `<Location>` blocks for `/nodejs` and `/pma`, then **update
`pipeline.yml` deliberately**: the CI assertions for those two paths currently
expect `200` anonymously and must be flipped to `401` at the same time. This is
the flip described in [ADR-0005](ADR.md#adr-0005-record-partial-authentication-coverage).

**Requirements verified only by review.** The five SRS-D obligations depend on a
human remembering. Nothing in the repository enforces them, so they are the most
likely thing to be skipped under time pressure.

**SRS-F-08 is only manually verified.** CI never calls `/nodejs/api/items`, so a
regression that broke the `items` query would pass. Adding one assertion to the
existing connectivity step would close this cheaply.

## Related documents

[SRS.md](SRS.md) 繚 [PRD.md](PRD.md) 繚 [ADR.md](ADR.md)
