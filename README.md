# Destroyer

Destroyer is one realistic full-stack Askr application. It is the integration and product-hardening workspace that sits beyond the progressive learning path in `askr-examples`.

The existing operations SPA is the product foundation. The same route registry now supports direct client rendering and server rendering, while one server composition root owns APIs, cookie sessions, request IDs, security headers, rate limits, access logs, lifecycle probes, and production startup.

## Application shape

- `src/pages` and `src/features` contain the real operations product surfaces.
- `src/server/api.ts` declares the OpenAPI-backed operational and support APIs.
- `src/server/app.ts` composes middleware, authentication, API routing, probes, and SSR fallback.
- `src/server/dependencies.ts` is the adapter boundary for repositories and infrastructure.
- `server.ts` is the production Node entrypoint.

The in-memory adapters keep the repository self-contained. Production adapters belong behind the same dependency interfaces rather than inside route handlers.

## Commands

```sh
npm install
npm run dev
npm run check
npm run preview
```

Local Askr packages remain `file:` dependencies so Destroyer exercises the current workspace implementation directly.
