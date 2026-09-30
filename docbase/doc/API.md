# API

All paths are relative to the gateway at `http://<host>:2380`. Backends are not
addressable directly.

## Authentication matrix

| Path | Auth | Enforced by |
|---|---|---|
| `/reactjs/**` | basic auth | `<Location /reactjs>` in `codebase/apache/vhost.conf` |
| `/nodejs/**` | **none** | ??|
| `/pma/**` | **none** | ??|

The unprotected rows are a known gap, not an intended design. See
[ADR-0005](ADR.md#adr-0005-record-partial-authentication-coverage).

## Routing

| Incoming | Forwarded to |
|---|---|
| `/reactjs/*` | `http://prototype-application-proxy-reactjs:80` |
| `/nodejs/*` | `http://prototype-application-proxy-nodejs:3000` |
| `/pma/*` | `http://prototype-application-proxy-pma:80` |
| `/` | `RedirectMatch` ??`/reactjs/` |

`ProxyPassReverse` is configured for each, so backend redirects are rewritten
back through the gateway path.

## Endpoints served by the Node API

The API is mounted at `/nodejs`, so its own `/api/*` routes appear under
`/nodejs/api/*` at the gateway.

### `GET /nodejs/api/health`

Database round-trip check. Used by CI as the primary liveness assertion.

**200**

```json
{ "status": "ok", "db": true }
```

`db` is `true` only if `SELECT 1` succeeded.

**500**

```json
{ "status": "error", "message": "<driver error>" }
```

### `GET /nodejs/api/items`

Returns every row from the `items` table as a JSON array.

**200**

```json
[
  { "id": 1, "name": "prototype item 1", "created_at": "2026-01-01 00:00:00" },
  { "id": 2, "name": "prototype item 2", "created_at": "2026-01-01 00:00:00" }
]
```

The two rows exist because `codebase/mysql/init.sql` seeds them on first
initialisation. An empty array means the data directory was not empty when the
container first started ??see the `init.sql` gotcha in [Configuration&Settings.md](Configuration&Settings.md).

**Errors.** Unlike the health endpoint, this route has no `try`/`catch`: a
database failure is returned as an unhandled rejection and surfaces as a `500`
with an empty body. This is a defect, not a contract.

### Not implemented

There is no `POST`, `PUT` or `DELETE`. The API is read-only. The React frontend
issues no writes either.

## Internal endpoints

These exist inside containers but are not routed by the proxy.

| Endpoint | Container | Purpose |
|---|---|---|
| `GET /healthz` | `reactjs` | returns `200 ok`, used for container-level checks |
| `/` | `pma` | phpMyAdmin's own entry point, reached via `/pma/` |

## Error behaviour

| Status | Cause |
|---|---|
| `401` | missing or invalid credentials on `/reactjs` |
| `302` | request to exactly `/` |
| `404` | unmapped path, including the frontend's own `/api/health` request |
| `500` | database failure on `/api/health` or `/api/items` |

## Related documents

[Architecture.md](Architecture.md) 繚 [Schema.md](Schema.md) 繚 [SRS.md](SRS.md)
