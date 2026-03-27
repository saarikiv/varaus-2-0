# Project Structure

Monorepo with three independent packages at the root level. Each has its own `package.json` and `node_modules`.

```
/
├── varaus/                     # Frontend SPA
│   ├── src/
│   │   ├── app.jsx             # Entry point, Redux store setup
│   │   ├── routes.jsx          # React Router route definitions
│   │   ├── config.js           # Firebase config (gitignored, see config.example.js)
│   │   ├── dev/
│   │   │   ├── actions/        # Redux action creators (one file per domain)
│   │   │   ├── components/     # React components grouped by feature (admin/, booking/, common/, etc.)
│   │   │   ├── helpers/        # Utility functions
│   │   │   ├── reducers/       # Redux reducers (one per domain + combinedReducer.js)
│   │   │   └── views/          # Page-level components (one .jsx per route)
│   │   └── styles/             # SCSS files (one per concern)
│   ├── public/                 # Built output served by Firebase Hosting
│   ├── test/
│   │   ├── fixtures/           # Shared test data
│   │   ├── helpers/            # Test utilities (mockStore, etc.)
│   │   ├── property/           # Property-based tests (*.property.js)
│   │   └── unit/               # Unit tests (*.test.js)
│   └── firebase.json           # Firebase Hosting + Database rules config
│
├── varausserver/               # Backend API
│   ├── src/
│   │   ├── server.js           # Express app entry point, Firebase Admin init
│   │   ├── setHeaders.js       # CORS and header configuration
│   │   ├── post/               # Route handlers (one file per endpoint, postXxx.js pattern)
│   │   ├── middleware/         # Express middleware (auth.js, adminAuth.js)
│   │   └── helpers/            # Shared utilities (mailer, time, error, validation)
│   ├── public/                 # Bundled output + Firebase service account configs
│   ├── tests/
│   │   ├── mocks/              # Test mocks
│   │   ├── property/           # Property-based tests
│   │   └── unit/               # Unit tests
│   └── Procfile                # Heroku deployment config
│
├── coordination/               # Dev environment orchestration CLI
│   ├── src/
│   │   ├── cli/                # CLI entry point and command definitions
│   │   ├── config/             # Configuration management and dependency checking
│   │   ├── health/             # Health check system
│   │   ├── logging/            # Structured logging and flow tracing
│   │   ├── process/            # Process lifecycle management and monitoring
│   │   ├── test/               # Test coordination
│   │   └── types.ts            # Shared TypeScript type definitions
│   └── tests/
│       ├── property/           # Property-based tests (*.property.test.ts)
│       └── unit/               # Unit tests (*.test.ts)
│
└── .kiro/
    ├── specs/                  # Feature and bugfix specifications
    └── steering/               # AI assistant steering rules (this directory)
```

## Key Patterns

- **Backend route files** follow the `postXxx.js` naming convention and export a `setApp(JPS)` function that registers routes on the shared `JPS` app object.
- **Frontend state** uses Redux with a domain-based split: one action file + one reducer file per feature area.
- **Frontend components** are grouped by feature under `components/` (admin, booking, common, shop, user, etc.).
- **Views** are page-level components that map 1:1 to routes.
- **Property-based tests** use fast-check across all three packages and follow the `*.property.{js,test.ts}` naming convention.
- **Firebase config** is environment-aware: production vs staging configs are selected at runtime in the backend.
