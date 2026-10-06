# everyday. — storefront and admin workspace

React + Vite frontend for the product and order API. Customers browse and order without an account. Admin routes validate access through `GET /api/admin/me`.

## Local setup

Use Node.js 22.13 or newer on the Node 22 release line.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the actual backend origin (no `/api` suffix). Use your local backend origin while testing backend changes that have not been deployed.
3. Run `npm run dev`.

The existing local environment points to a Render deployment. This does not guarantee that deployment implements the latest contract. Restart Vite after changing the origin. Never place the admin registration key or other secrets in frontend environment variables.

## Routes

- `/`: public collection, title/description search and exact category filtering.
- `/products/:id`: public product details and availability.
- `/products/:id/order`: public single-product cash-on-delivery order form and receipt.
- `/admin/login`: public admin sign-in.
- `/admin`: inventory summary, product management and paginated incoming orders.
- `/admin/register`: protected admin registration inside the workspace; requires an existing admin session and sends a bearer token. Registration returns to the dashboard without replacing the current session. The backend registration route must enforce admin authorization; new accounts still require store owner approval.
- `/admin/products`, `/admin/low-stock`: inventory with category, search and stock filters.
- `/admin/products/new`, `/admin/products/:id/edit`: image upload, category suggestions, price and absolute stock updates.

Products use `_id`, `image.url` and NPR pricing. Legacy products fall back to category `Uncategorized`, stock `0`, and threshold `5`. Low-stock includes sold-out products and products exactly at their limit. Counts and category options come from the full public product list.

## Sessions and orders

Access tokens stay in memory; refresh tokens and a display profile use tab-scoped sessionStorage. A profile or token alone never grants admin UI access. The route guard calls `/api/admin/me`. Protected requests refresh once after 401 and retry once; failed refresh clears the session and returns protected screens to login. A 403 is access denied. Logout sends a bearer token with no body and clears local storage even if the request fails.

Order submissions generate one UUID v4 per new attempt and freeze the JSON payload. Failed submissions lock the fields and offer a retry using the identical request ID and body. Pending attempts are saved in sessionStorage so navigation or reloading the same tab preserves the retry. If browser storage is unavailable, keep the page open to use the in-memory retry. Retries preserve the same request ID and details for all errors, including 429; 409 also refreshes product availability. Successful submissions show the reference, server-confirmed product total, payment method and status, then refresh stock. Full name (`customerName`), phone number (`phoneNumber`) and delivery location (`address`) are required; email and notes remain optional. Admins can save pending/confirmed status changes through authenticated `PATCH /api/orders/:id/status` requests with `{ status }`. There is no cart or online payment.

Serve production over HTTPS for `crypto.randomUUID()`. The backend must implement the documented order endpoints, support MongoDB transactions, and initialize its unique request-ID index. Backend deployment and database configuration are separate from this frontend.

## Deployment

Set `VITE_API_BASE_URL` in the host environment before building. Redeploy after changes because Vite embeds it at build time. `vercel.json` already rewrites client paths to `index.html`; configure the equivalent SPA fallback on other hosts. The backend must allow the frontend origin and GET, POST, PUT, DELETE, OPTIONS with Content-Type and Authorization through CORS. Requests omit cookies. Expose `Retry-After` through `Access-Control-Expose-Headers` so the frontend can read the cooldown across origins. Both delay seconds and HTTP dates are supported; missing or invalid headers use a 60-second fallback. During the cooldown, controls are disabled and the API client blocks further requests to that backend, including after a tab reload. HTTP 413 displays a submission-size message.

## Checks

`npm run lint`, `npm test`, `npm run build`.

For restricted environments that cannot spawn test workers, use `node --experimental-test-isolation=none --test`.

Registration sends only name, username, password and phoneNumber. Name/username are limited to 100 characters, phone to 25, and passwords to at least 6 characters and at most 72 UTF-8 bytes. Never place admin keys or JWT signing secrets in frontend code or environment files.

## Frontend file structure

`src/App.jsx` selects routes and connects the layouts. Each screen has its own file:

| Route | Screen |
| --- | --- |
| `/` | `screens/home_screen.jsx` |
| `/admin/login` | `screens/login_screen.jsx` |
| `/admin/register` | `screens/register_screen.jsx` |
| `/admin` | `screens/dashboard_screen.jsx` |
| `/admin/products` | `screens/products_screen.jsx` |
| `/admin/products/new` | `screens/add_product_screen.jsx` |
| `/admin/products/:id/edit` | `screens/edit_product_screen.jsx` |
| `/admin/products/:id/delete` | `screens/delete_product_screen.jsx` |
| `/admin/low-stock` | `screens/low_stock_screen.jsx` |
| `/admin/orders` | `screens/orders_screen.jsx` |
| `/products/:id` | `screens/product_details_screen.jsx` |
| `/products/:id/order` | `screens/order_screen.jsx` |
| Unmatched route | `screens/not_found_screen.jsx` |

Shared cards, inventory, product editor, order form, access guard and UI elements live in `src/components/`. The product card is `components/product_card.jsx`. Site, authentication and admin shells live in `src/layouts/`. Navigation and loading hooks live in `src/hooks/`; product display/filter helpers live in `src/utils/products.js`. API calls remain in `src/services/`. Delete opens a dedicated confirmation screen and only sends the DELETE request after confirmation.
