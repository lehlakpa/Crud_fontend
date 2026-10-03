# CRUD authentication frontend

React + Vite registration, login, and logout UI.

## Run locally

Use Node.js 22.13+ on the Node 22 release line, or Node.js 24+.

1. Run `npm install`.
2. Copy `.env.example` to `.env` if it does not exist.
3. Run `npm run dev`.

`VITE_API_BASE_URL` is the backend origin, without /api/auth. Restart Vite after changes. Vite environment values are public browser configuration; never put passwords or private keys in them. Local .env files are ignored; .env.example is a shareable template.

## Organization

- src/screens/: separate login, registration, and home UI with each screen's own form, loading, errors, and action logic.
- src/App.jsx: screen navigation and session restoration.
- src/services/auth.js: POST requests, parsing, timeout, API errors.
- src/constants/auth.js: API origin, endpoints, timeout, storage key.

Registration sends { name, username, password, phoneNumber } to /api/auth/register, then returns to login. Login sends { username, password } to /api/auth/login. Logout posts the refreshToken to /api/auth/logout and clears the saved session on success or an expired-session response.

Requests omit cookie credentials to work with the backend's wildcard CORS origin. Login returns accessToken, refreshToken, and user. The access token stays in memory; the refresh token and a minimal display profile are saved in sessionStorage so reloading the same tab preserves the session. Passwords are never stored. On startup, POST /api/auth/refresh-token receives { refreshToken } and returns a new accessToken. The existing refresh token is retained unless the server returns a replacement. Storage is scoped to the browser tab rather than a permanent remembered login.

src/services/session.js owns session storage, restoration, logout, and authenticated requests. A protected request returning 401 refreshes once and retries once. Concurrent failures share a refresh request. Invalid refresh tokens clear the session; network/server failures preserve it for retry. Startup shows a loading screen until restoration completes, avoiding a login-screen flash. The saved profile is display data only; the backend remains responsible for authorization. Browser session storage is accessible to app JavaScript; an HttpOnly cookie design would require backend changes.

Products load automatically after session restoration and after changes. Use the browser's normal reload (or mobile pull-to-refresh); the product toolbar has no Refresh button.

The backend must allow Content-Type and Authorization headers through CORS. If switching to cookie authentication, configure an explicit frontend origin and Access-Control-Allow-Credentials on the backend before enabling credentials in the frontend. Confirm the response schema if your backend uses other token/profile fields.

## Products

The signed-in home screen lists products from GET /api/products. Details use GET /api/products/:id. Create and update send multipart FormData (title, price, description, and image) using POST /api/products and PUT /api/products/:id. An image is required for creation and optional for updates; image URL and public_id are supplied by the backend upload handler. DELETE /api/products/:id requires an explicit confirmation in the UI. All writes send the login Bearer token. Prices have no currency symbol because the model does not specify a currency.

Product presentation and state/actions live in src/screens/home_screen.jsx. Details, add/edit forms, and deletion confirmation open in a scrollable bottom sheet with background scroll locked. Close it using Close, Escape, or the backdrop; dismissal is disabled during a request. Requests/validation live in src/services/products.js and constants in src/constants/products.js. Both auth and products share src/services/api.js.

## Validation

Run `npm run lint`, `npm run build`, and `npm test`. API tests mock responses without creating accounts on the deployed backend.

In restricted environments that block test worker processes, run `node --experimental-test-isolation=none --test`.
