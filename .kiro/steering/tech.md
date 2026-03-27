# Tech Stack & Build System

## Runtime
- Node.js 20.x (required across all packages)

## Frontend (`varaus/`)
- React 18 with JSX (`.jsx` files)
- Redux 4 + redux-thunk for state management
- React Router 6 (HashRouter)
- Webpack 5 + Babel for bundling
- SCSS for styling
- date-fns and moment for date handling
- d3 for data visualization
- react-hook-form and redux-form for forms
- Firebase JS SDK (client-side auth and database reads)

## Backend (`varausserver/`)
- Express 4
- Firebase Admin SDK 12 (server-side auth verification, database writes)
- Mailgun for email notifications
- Webpack 5 for production bundling
- Paytrail payment integration
- Deployed via Heroku (Procfile present)

## Coordination (`coordination/`)
- TypeScript 5.3 (strict mode, ES2022 target, CommonJS output)
- CLI tool with process management, health checks, and logging
- Mocha + Chai for testing
- fast-check for property-based testing

## Testing

### Frontend tests
```bash
cd varaus
npm test                    # Mocha + Babel + test_helper.jsx
```
- Mocha + Chai with Babel transpilation
- fast-check for property-based tests
- Test fixtures in `test/fixtures/`
- Property tests in `test/property/` (`.property.js`)
- Unit tests in `test/unit/`

### Backend tests
```bash
cd varausserver
npm test                    # Jest
```
- Jest test runner
- fast-check for property-based tests
- Property tests in `tests/property/`
- Unit tests in `tests/unit/`
- Mock helpers in `tests/mocks/`

### Coordination tests
```bash
cd coordination
npm test                    # All tests
npm run test:unit           # Unit tests only
npm run test:property       # Property tests only
```
- Mocha + Chai with ts-node
- fast-check for property-based tests
- Property tests in `tests/property/` (`.property.test.ts`)
- Unit tests in `tests/unit/`

## Build Commands

### Frontend
```bash
cd varaus
npm run rebuild             # Webpack build + npm install
npm run dev                 # Dev server with HMR
```

### Backend
```bash
cd varausserver
npm run build               # Webpack production build
npm run build:dev           # Webpack development build
npm start                   # Run from public/
```

### Coordination
```bash
cd coordination
npm run build               # TypeScript compilation
npm run start:dev           # Run via ts-node
npm run clean               # Remove dist/
```
