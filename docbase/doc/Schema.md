# Schema

Defined by `codebase/mysql/init.sql`, which the `mysql` image executes from
`/docker-entrypoint-initdb.d/` **only when the data directory is empty**.

```sql
CREATE TABLE IF NOT EXISTS items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO items (name) VALUES
  ('prototype item 1'),
  ('prototype item 2');
```

## Tables

### `items`

| Column | Type | Null | Key | Default | Notes |
|---|---|---|---|---|---|
| `id` | `INT` | no | `PRIMARY KEY`, `AUTO_INCREMENT` | — | surrogate key |
| `name` | `VARCHAR(255)` | no | — | — | free text, not unique |
| `created_at` | `TIMESTAMP` | yes | — | `CURRENT_TIMESTAMP` | set on insert |

The `TIMESTAMP` is not `NOT NULL` and has no `ON UPDATE`, so it records insertion
only.

## Indexes

The only index is the implicit one the primary key creates. `name` is unindexed
and unconstrained, so duplicate values are permitted. There is no foreign key
anywhere in the schema.

## Seed data

Two rows, inserted only on a fresh data directory:

| `id` | `name` |
|---|---|
| 1 | `prototype item 1` |
| 2 | `prototype item 2` |

Because the statement is a bare `INSERT` with no `IGNORE` and no
`ON DUPLICATE KEY`, re-running it against a populated table fails. The
`CREATE TABLE IF NOT EXISTS` is idempotent; the insert is not.

## Reapplying schema changes

`/docker-entrypoint-initdb.d/` is skipped on every restart after the first
initialisation. To apply a modified `init.sql` you must destroy the data
directory:

```shell
rm -rf codebase/mysql/data
docker compose up -d
```

This drops all data. There is no migration tooling in this project.

## Database-level facts

- Server: `mysql:8.0`.
- Credentials come from the `MYSQL_*` variables in `.env`; the database, user and
  password are created by the image's own entrypoint.
- The API reaches the database as `DB_USER` / `DB_PASS` via a `mysql2` pool of
  ten connections.
- phpMyAdmin connects as `PMA_USER` if set, otherwise root.

## Known issues

- No migration tool, so schema changes are destructive by necessity.
- The seed `INSERT` is not idempotent; combined with the fresh-directory
  requirement this makes partial application easy to get wrong.
- `created_at` is nullable with no explicit behaviour for a null value.
- `items.name` has no length or format constraint beyond `VARCHAR(255)`.

## Related documents

[ERD.md](ERD.md) · [API.md](API.md) · [CRM.md](CRM.md)
