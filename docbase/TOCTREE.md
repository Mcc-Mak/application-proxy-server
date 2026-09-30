# TOCTREE

Documentation for the Application Proxy Server prototype. Every document below is
maintained alongside the change it describes — see the per-change checklist in
[`../AGENTS.md`](../AGENTS.md).

If you add a document, add it to this list. If you delete one, remove it here.

## 1. Overview and requirements

| Document | Purpose |
|---|---|
| [ProjectCharter.md](doc/ProjectCharter.md) | Why the prototype exists, scope, constraints, success criteria |
| [PRD.md](doc/PRD.md) | Product requirements: the problem, the users, what the gateway must do |
| [SRS.md](doc/SRS.md) | Software requirements: numbered, testable requirements the CI asserts |

## 2. Decisions and design

| Document | Purpose |
|---|---|
| [ADR.md](doc/ADR.md) | Architecture decision records — one per significant choice, with status |
| [Architecture.md](doc/Architecture.md) | How the system is wired: containers, networks, request flow |

## 3. Interfaces and data

| Document | Purpose |
|---|---|
| [API.md](doc/API.md) | The HTTP surface exposed through the proxy |
| [Schema.md](doc/Schema.md) | Database schema as created by `codebase/mysql/init.sql` |
| [ERD.md](doc/ERD.md) | Entity-relationship view of the schema |

## 4. Delivery

| Document | Purpose |
|---|---|
| [QuickStart.md](doc/QuickStart.md) | Getting the stack running from a clean machine |
| [RTM.md](doc/RTM.md) | Requirements traceability matrix: requirement → implementation → test |
| [CRM.md](doc/CRM.md) | Cross-reference matrix: every element traced across requirement, code, doc, test and known issue |
| [Configuration&Settings.md](doc/Configuration&Settings.md) | Every variable, container name, base image and CI setting, with the reasoning behind the non-obvious ones |

## Conventions

- Documents describe the system **as it is**, not as it is planned. Known defects
  are recorded under "Known issues" in the relevant document rather than omitted.
- Paths are relative to the repository root, so `codebase/apache/vhost.conf`.
- Documentation lives in `docbase/`. Everything runnable lives in `codebase/`.
  Nothing runnable should ever be added under `docbase/`.
