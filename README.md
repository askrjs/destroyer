# destroyer

Destroyer is a stress-test monorepo for the AskR ecosystem. It keeps one realistic app for each primary delivery mode so we can surface integration issues before users do.

## Apps

- `spa-app`: client-rendered dashboard-style app.
- `ssr-app`: server-rendered operations app with client hydration.
- `ssg-site`: static documentation and content site.

## Commands

```sh
npm install
npm run dev:spa
npm run dev:ssr
npm run dev:ssg
npm run test
```

Local AskR packages are referenced with `file:` dependencies. The release-matrix scripts can pack and reinstall local tarballs when we want to test the same shape consumers get from npm.

