# Quick Start

Getting the stack running on a clean Linux machine with Docker Engine and
Compose v2. Every command runs from the repository root unless stated otherwise.

## Prerequisites

- Docker Engine with the Compose v2 plugin (`docker compose`, not
  `docker-compose`)
- `htpasswd`, from the `apache2-utils` package, to manage proxy users
- Enough resources for five containers, roughly 2 GB of RAM

## 1. Create the external network

**This must come first.** The Compose file declares the network
`external: true`, so Compose refuses to create it and every command below fails
until it exists.

```shell
docker network create -d bridge --subnet 172.70.0.0/24 prototype_application_proxy
```

It is safe to re-run; if the network already exists the command errors harmlessly.

## 2. Create the environment file

`.env` is never committed. Compose reads it, and every database setting is
required — without them the variables expand to empty strings and MySQL will
refuse to start.

```shell
cp codebase/.env.example codebase/.env
```

Defaults, all of which are throwaway and appropriate for a prototype:

| Variable | Example |
|---|---|
| `MYSQL_ROOT_PASSWORD` | `rootpass` |
| `MYSQL_DATABASE` | `prototype` |
| `MYSQL_USER` | `proto` |
| `MYSQL_PASSWORD` | `protopass` |

## 3. Create the proxy credentials

The Apache image `COPY`s `codebase/apache/.htpasswd`, so the file must exist
before the first build or the build fails.

```shell
htpasswd -c codebase/apache/.htpasswd admin
htpasswd    codebase/apache/.htpasswd user2
```

`admin` already exists in the committed file. Use `-c` **only** the first time:
it truncates the file and destroys every other user. To add users afterwards,
omit `-c`.

The project requires two or more users, so add `user2` at minimum.

## 4. Build and start

Run from inside `codebase/`, so Compose picks up both the Compose file and the
`.env` beside it:

```shell
cd codebase
docker compose build --no-cache
docker compose up -d --force-recreate
```

`up` blocks until MySQL is healthy, because `nodejs` and `pma` declare
`depends_on: mysql: condition: service_healthy`.

## 5. Verify

```shell
cd codebase
docker compose ps
```

All five services should report `running`. Then, from anywhere:

```shell
curl -i http://localhost:2380/reactjs/                       # expect 401
curl -i -u admin:PASSWORD http://localhost:2380/reactjs/     # expect 200
curl -s http://localhost:2380/nodejs/api/health              # expect {"status":"ok","db":true}
curl -s http://localhost:2380/nodejs/api/items               # expect 2 rows
curl -o /dev/null -w '%{http_code}\n' http://localhost:2380/pma/   # expect 200
```

Then open <http://localhost:2380/> — it redirects to `/reactjs/` and prompts for
credentials.

## Running Compose from the repository root

If you prefer not to `cd`, both of these work. Omitting the project directory
is the common mistake: Compose then looks for `.env` in the wrong place.

```shell
# either
docker compose -f codebase/docker-compose.yml --project-directory codebase up -d

# or
docker compose --env-file codebase/.env -f codebase/docker-compose.yml up -d
```

## Stopping

```shell
cd codebase
docker compose down            # keep the database data
docker compose down -v         # also discard the data directory
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `network prototype_application_proxy declared as external, but could not be found` | step 1 not done, or on a new machine | create the network |
| `Apache` build fails copying `.htpasswd` | file missing | step 3 |
| MySQL exits immediately | `MYSQL_*` empty | `.env` missing or not found; check you are in `codebase/` |
| `/reactjs/` returns 404 for assets | known CRA defect | see [Architecture.md](Architecture.md#known-issues) |
| `/reactjs/` health panel shows an error | known, `/api/health` is not routed | see [Architecture.md](Architecture.md#known-issues) |
| `items` is empty | `init.sql` only runs on a fresh data directory | `rm -rf codebase/mysql/data` then `up -d` |
| phpMyAdmin redirects to `hkss13` | hardcoded `PMA_ABSOLUTE_URI` | set it to the URL you actually use |

## Related documents

[Architecture.md](Architecture.md) · [CRM.md](CRM.md) · [ADR.md](ADR.md)
