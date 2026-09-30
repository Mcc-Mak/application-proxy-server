# Entity-Relationship Diagram

## Current model

```mermaid
erDiagram
    ITEMS {
        INT id PK "auto_increment"
        VARCHAR_255 name "NOT NULL, unindexed"
        TIMESTAMP created_at "default CURRENT_TIMESTAMP"
    }
```

The schema contains exactly one table and therefore exactly one entity. There
are no relationships to draw — no foreign keys, no joins, no junction tables.

## Cardinality

Not applicable. With a single entity there is nothing to relate it to.

## Access paths

Two independent clients read the same table, and neither writes to it:

```mermaid
flowchart LR
    U["User / operator"] -->|"HTTP :2380"| P["proxy"]
    P --> N["nodejs API"]
    N -->|"mysql2 pool<br/>10 connections"| DB[("items")]
    P --> A["phpMyAdmin"]
    A -->|"mysql client"| DB
```

| Path | Route | Auth |
|---|---|---|
| Programmatic | `GET /nodejs/api/items` → `SELECT * FROM items` | none |
| Interactive | `/pma/` → phpMyAdmin | none |

Both are read-only against `items`. There is no write endpoint in the API, so
phpMyAdmin is currently the only way to modify data.

## Implied extension

The `items` table is a placeholder so the API and the database link have
something real to exercise. If the prototype grows, the natural first
relationship is ownership or authorship:
```mermaid
erDiagram
    ITEMS {
        INT id PK
        VARCHAR_255 name
        TIMESTAMP created_at
    }
    USERS {
        INT id PK
    }
    USERS ||--o{ ITEMS : "items.owner_id -> users.id"
```

`USERS` is hypothetical; the relationship above is what the prototype would
grow into, not what it has. Adopting it would require a `users` table, a foreign
key, and an index on `items.owner_id`. None of that exists today, and it is not
in scope — see [ProjectCharter.md](ProjectCharter.md#scope).

## Related documents

[Schema.md](Schema.md) · [API.md](API.md) · [Architecture.md](Architecture.md)
