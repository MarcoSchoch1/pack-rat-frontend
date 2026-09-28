# pack-rat-frontend

Angular frontend for **Pack-Rat**, a personal collection tracker for tabletop and trading card game collectors whose niche sets, regional exclusives and lesser-known products don't show up in mainstream apps.

This is one of three repositories:

| Repository | Contents |
|---|---|
| [pack-rat-docs](https://github.com/MarcoSchoch1/pack-rat-docs) | Project overview, architecture decision records, API and UI design, issue board |
| [pack-rat-backend](https://github.com/MarcoSchoch1/pack-rat-backend) | Spring Boot REST API and PostgreSQL |
| **pack-rat-frontend** | This repo: Angular single-page app |

## Tech stack

- **Angular 22**: standalone components, signals, functional interceptors
- **Tailwind CSS 4** for styling ([ADR-011](https://github.com/MarcoSchoch1/pack-rat-docs/blob/main/adr/adr.md#adr-011-use-tailwind-css-instead-of-a-component-library-eg-angular-material))
- **Vitest** with jsdom for unit tests
- **Prettier** for formatting

## Getting started

### Requirements

- Node.js `^22.22.3`, `^24.15.0` or `>=26.0.0` (required by Angular 22)
- The [backend](https://github.com/MarcoSchoch1/pack-rat-backend) running on `http://localhost:8080`

### Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. The app reloads on file changes.

The development build calls the backend directly at `http://localhost:8080/api`. There is no dev-server proxy; the backend allows `http://localhost:4200` through its CORS configuration ([ADR-016](https://github.com/MarcoSchoch1/pack-rat-docs/blob/main/adr/adr.md#adr-016-explicit-cors-configuration-via-spring-security-not-a-reverse-proxy-workaround)). If you serve on a different port, add that origin to the backend's `app.cors.allowed-origins`.

### Scripts

| Command | Description |
|---|---|
| `npm start` | Dev server with the development environment |
| `npm run build` | Production build into `dist/frontend` |
| `npm run watch` | Development build in watch mode |
| `npm test` | Unit tests (Vitest) |

## Configuration

The backend URL is set per build in `src/environments/`:

| File | Used by | `apiUrl` |
|---|---|---|
| `environment.development.ts` | `ng serve`, development builds | `http://localhost:8080/api` |
| `environment.ts` | Production builds | Deployed backend URL |

`angular.json` swaps the development file in through `fileReplacements`. No secrets belong in these files, since everything in them ships to the browser.

## Architecture

```
src/app/
├── interceptor/
│   └── auth.interceptor.ts   Attaches the JWT, logs out on 401
├── service/
│   ├── apiservice.ts         Single entry point for backend calls
│   └── auth.service.ts       Login, logout, token storage
├── testing/
│   └── fake-jwt.ts           Test helper for building JWTs
├── app.config.ts             Providers: router, HttpClient, interceptors
└── app.routes.ts             Route definitions
```

### Backend communication

All HTTP calls go through `ApiService`, never through `HttpClient` directly:

```ts
private readonly api = inject(ApiService);

collections$ = this.api.get<Collection[]>('collections');
```

- Paths are relative to the configured `apiUrl`.
- Every failed request becomes an `ApiError` with `status`, `code`, `message` and `field`, matching the backend's [error format](https://github.com/MarcoSchoch1/pack-rat-docs/blob/main/backend/api-design.md#error-handling). Network failures use the code `NETWORK_ERROR`.
- Components never handle `HttpErrorResponse`.

### Authentication

The backend issues a stateless JWT on `POST /api/auth/login` ([ADR-007](https://github.com/MarcoSchoch1/pack-rat-docs/blob/main/adr/adr.md#adr-007-jwt-for-authentication-instead-of-server-side-sessions)).

- `AuthService` stores the token in `localStorage` and checks its `exp` claim before each use. A token is treated as expired 10 seconds early so it can't expire in transit.
- `authInterceptor` adds `Authorization: Bearer <token>` to requests aimed at the backend's `apiUrl`. The token is never sent to other hosts.
- When the backend answers a request that carried a token with 401, the interceptor clears the token and redirects to `/login`.

**Known trade-offs:**

- A token in `localStorage` can be read by any script that runs on the page, so an XSS vulnerability would expose it. An httpOnly cookie would avoid this but requires a different backend auth design.
- There is no refresh token. Sessions end when the token expires (1 hour), and the user logs in again.

## Testing

```bash
npm test
```

Specs sit next to the code they test (`*.spec.ts`). HTTP behavior is tested with `HttpTestingController`, without a running backend.

`vitest-base.config.mts` starts test workers with `--no-experimental-webstorage`. Node 25 and later ship their own global `localStorage`, which replaces jsdom's and is undefined unless Node is started with a storage file.

## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and reference the issue number, e.g. `feat: add item form #5`.
- Formatting is handled by Prettier (`.prettierrc`: 100 columns, single quotes).
- New issues are added to the [project board](https://github.com/users/MarcoSchoch1/projects/1) automatically by `.github/workflows/add-to-project.yml`.

## Status

Early development. The HTTP and authentication foundation is in place. Screens ([UI design](https://github.com/MarcoSchoch1/pack-rat-docs/blob/main/frontend/ui-design.md)) are next:

- [x] API service, JWT authentication, error handling
- [ ] Login
- [ ] Collection dashboard
- [ ] Add item form with image upload
- [ ] Item detail
