# Destroyer

Destroyer is a production-shaped Askr operations application. It exercises SSR, protected APIs,
actions, cookie authentication, SQLite migrations, live operational queries, themed product flows,
and route-lifecycle behavior as one deployable consumer—not as a component gallery.

## Runtime shape

- `src/pages` and `src/features` own product routes, query models, and presentation.
- `src/server/config.ts` validates the host, port, database path, JWT key, key ID, and environment
  once at startup.
- `src/server/database.ts` applies idempotent SQLite migrations and deterministic seed input while
  preserving existing operator accounts and support records.
- `src/server/repositories.ts` exposes typed account, settings, operations, support, invoice,
  health, and lifecycle boundaries. Route and action handlers never receive raw database access.
- `src/server/api.ts` declares protected settings, activity, summary, cursor-paged logs, metrics,
  and invoice APIs plus the public, persisted, rate-limited contact endpoint.
- `server.ts` is the production Node entry point.

Local development stores data in `.data/destroyer.sqlite` by default. Browser tests use an isolated
in-memory database. Set `DESTROYER_DB_PATH` to retain data elsewhere. Production startup also
requires `DESTROYER_JWT_PRIVATE_KEY` containing an RSA private JWK; `DESTROYER_JWT_KID`, `HOST`, and
`PORT` are configurable.

## Askr packages

Destroyer installs ranged releases from the npm registry for `@askrjs/askr`, auth, charts, lucide,
node, schema, server, themes, UI, and the Vite integration. It has no sibling aliases, `file:`
dependencies, local package declarations, or consumer-owned compatibility wrappers.

## Commands

```sh
npm install
npm run dev
npm run check
npm run test:production
npm run test:browser
npm run test:journey
npm run test:heap
npm run acceptance
npm run preview
```

`check` runs lint, typecheck, unit tests, and one production build. Production-artifact and browser
tests consume that build; unit tests explicitly exclude `dist`. The responsiveness lane retains its
five route cycles, while the heap lane retains two warmups plus ten measured cycles and its existing
long-task, DOM-host, slope, growth, and retention limits.
