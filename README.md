# ElegAI — AI-Powered Bridal & Formal-Wear E-Commerce Platform

ElegAI is a full-stack e-commerce application for a bridal and formal-wear boutique. It lets
customers discover bridal gowns, evening gowns, formal dresses, suits, barongs and accessories —
and its signature feature is an **AI formal-wear recommendation engine** that recommends real
products from the catalog based on occasion, style, color, fit, measurements and an optional photo.

> **Administrator:** sign in at `/admin/login` with username `ElegaiAdmin` and password `Admin@123x`.
> Customers create their own accounts from the storefront — there are no demo customer logins.

---

## 📱 It's also a mobile app (PWA)

ElegAI ships with **two clients** for the same backend:

1. **Web storefront** (`frontend/`) — React + Tailwind, includes the full admin console.
2. **Native mobile app** (`mobile/`) — React Native + Expo, a real installable app with bottom
   tab navigation, native screens and an AI stylist with photo picker.

**Run the mobile app on your phone (no Android Studio needed):**

```bash
# 1. Backend up?
cd backend && npm start                      # :5000

# 2. Point the app at your backend (edit mobile/src/config.js → API_BASE)
#    phone + laptop on same Wi-Fi → http://<your-laptop-LAN-ip>:5000

# 3. Start Expo, scan the QR with the free "Expo Go" app
cd mobile && npm install && npx expo start
```

Full guide + learning map: **`mobile/README.md`**.

### PWA (installable home-screen app)

The web app is also a **Progressive Web App**: install it on your phone's home screen and it runs
like a native app — fullscreen, own icon, no browser address bar. Works on Android (Chrome) and
iOS (Safari). Includes a bottom nav bar on phones, offline app-shell caching (`frontend/public/sw.js`),
and a full icon set.

**Install it (when running on your machine or a public host):**
- **Android / Chrome:** open the app URL → menu (⋮) → **"Add to Home screen"** / **"Install app"**.
- **iPhone / iPad / Safari:** open the URL → **Share** button → **"Add to Home Screen"**.

**Run the whole app as ONE process (ideal for low-RAM machines like 4 GB laptops):**

```bash
cd frontend && npm run build          # build the UI once
cd ../backend
SERVE_FRONTEND=true npm start         # one process serves UI + API at http://localhost:5000
```

Then open http://localhost:5000 — that's the complete app (and the PWA).

---

## Architecture and decoupling

```text
React UI (pages/components/context)
        │ Axios → REST API (JWT Bearer)
        ▼
Express routes → controllers → feature repositories → database adapter → TiDB Cloud / MySQL
                         │
                         └── AI recommendation service → Gemini / OpenAI / local fallback
```

The frontend has no database credentials and never runs SQL. Backend controllers handle HTTP input and responses; feature repositories own SQL and database-specific behavior. The AI recommendation implementation is a separate service. This lets us change UI, API behavior, or persistence code with fewer unrelated changes. ElegAI remains one small deployable application (not a group of microservices).

**Security boundaries**
- The browser only calls the Express API through `/api`; it never connects to the database.
- AI API keys and the Turnstile secret stay in backend environment variables, never in frontend code.
- Passwords are hashed with **bcrypt**. Sign-in/registration returns a signed **JWT access token** (default expiry: 7 days, configurable with `JWT_EXPIRES_IN`), which the frontend sends as `Authorization: Bearer <token>`; admin routes check the role in that token.
- Password reset uses a 6-digit code. Only a SHA-256 hash of the code (bound to the user id) is stored; it expires after 15 minutes and can be used once. The code is normally emailed over SMTP, but an administrator can also generate one from **Admin → Customers** and share it directly (useful when no mail server is configured). There is no separate refresh-token flow; users sign in again after the JWT expires.
- Cloudflare Turnstile tokens are checked server-side. Authentication endpoints have stricter per-IP limits, with a general API limit as a backstop.
- Inputs are validated on the server, uploads are checked by MIME type and size, and Helmet + CORS are configured on the API.

### CAPTCHA, rate-limit, and token configuration

In local development, the backend uses Cloudflare's official test Turnstile keys automatically. The test widget is for integration testing only; it is not real bot protection. For a deployed app, create a Turnstile widget and set these **backend** environment variables:

```env
CAPTCHA_ENABLED=true
TURNSTILE_SITE_KEY=your-public-site-key
TURNSTILE_SECRET_KEY=your-private-secret-key
JWT_SECRET=your-own-long-random-secret-at-least-32-characters
```

The public site key is returned to the browser by `/api/auth/captcha-config`. The secret key is only used by the server to verify tokens. Never put `TURNSTILE_SECRET_KEY`, `JWT_SECRET`, or AI API keys in frontend variables or a public GitHub repository. Production startup rejects a missing/weak `JWT_SECRET`.

Default rate limits are 300 API requests per minute, 10 failed sign-ins per 15 minutes, 5 account-creation attempts per hour, 10 password-reset attempts per hour, and 30 AI stylist requests per hour per client IP. They use the built-in in-memory limiter store, which is appropriate for this single-instance class project; a multi-instance production service should use a shared store such as Redis.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Lucide icons |
| Backend | Node.js, Express, REST API |
| Database | TiDB Cloud Serverless (MySQL-compatible) in cloud; MySQL / MariaDB locally (`mysql2`) |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| AI | Gemini API or OpenAI API, with a built-in rule-based fallback engine |
| Images | Product images served by the backend; admin can upload via Multer (validated) |
| Mobile | PWA: installable home-screen app, offline app shell, app icons (`frontend/public/`) |
| 📱 Mobile app | React Native + Expo native app in `mobile/` — real app, runs via Expo Go, no Android Studio |

---

## Quick start

Prerequisites: Node.js ≥ 18 and MySQL 8 / MariaDB.

### 1. Database

```bash
# Option A — local MySQL/MariaDB
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS elegai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'elegai'@'localhost' IDENTIFIED BY 'elegai_pass';
CREATE USER IF NOT EXISTS 'elegai'@'127.0.0.1' IDENTIFIED BY 'elegai_pass';
GRANT ALL PRIVILEGES ON elegai.* TO 'elegai'@'localhost';
GRANT ALL PRIVILEGES ON elegai.* TO 'elegai'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

# Option B — Docker (MySQL 8)
docker compose up -d mysql
```

> The backend **auto-bootstraps the database**: it creates the schema (`sql/schema.sql`) and
> seeds the catalog + demo data (`sql/seed.sql`) on first start, so no manual migrations needed.

### 2. Backend

```bash
cd backend
cp .env.example .env      # then edit secrets if you like
npm install
npm start                 # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173  (proxies /api, /images, /uploads → :5000)
```

Or run everything in one shot on a fresh Ubuntu/Debian machine:

```bash
./setup.sh                # installs MariaDB, creates DB/user, installs deps, starts both servers
```

---

## AI configuration

The provider is auto-detected in this order: **gemini → openai → local**.

```bash
# backend/.env
GEMINI_API_KEY=your_key          # enables Gemini (photo analysis works here)
OPENAI_API_KEY=your_key          # or use OpenAI
# no keys → ElegAI Style Engine (deterministic, offline, always available)
```

The AI service:
1. Sends the customer's preferences (occasion, style, color, fit, size, measurements, notes,
   optional photo) plus a snapshot of the real product catalog to the LLM.
2. Asks for a strict JSON list of up to 6 recommendations **with reasons**, with hard rules to
   never comment on the customer's body.
3. Validates that recommended products exist in the catalog (matched by `product_id`).
4. Falls back to the local rule-based engine on any provider error, so the app never breaks.

Example response shape (shown on the AI Stylist page):

```
Recommended for you:
Elegant Ivory A-Line Wedding Gown
  ✓ Suitable for Wedding occasions
  ✓ Matches your Elegant style
  ✓ Available in your preferred color (Ivory)
  ✓ Offers the A-Line fit you prefer
[View Product]
```

---

## Customer features

| Feature | Where |
|---|---|
| Registration / Login / Logout | `/register`, `/login` |
| Password reset | `/forgot-password`, `/reset-password` (emailed 6-digit code, single-use, hashed in DB) |
| Profile + measurements + style preferences | `/profile` |
| Product catalog, search, filters, sort, pagination | `/catalog` |
| Product details + related items | `/products/:id` |
| **AI Stylist + AI recommendations** | `/stylist` |
| Shopping cart | `/cart` |
| Checkout (COD / GCash / Card demo) | `/checkout` |
| Order history + filters | `/orders` |
| Order tracking timeline + cancel pending orders | `/orders/:id` |
| Customer dashboard | `/dashboard` |

## Admin features

| Feature | Where |
|---|---|
| Admin login | `/admin/login` |
| Dashboard (revenue, orders, customers, 14-day sales chart, top products) | `/admin` |
| Product management (CRUD + image upload) | `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit` |
| Inventory management (set/adjust stock, low-stock indicators) | `/admin/inventory` |
| Order management (status changes through fulfilment) | `/admin/orders` |
| Customer management (spend summaries) | `/admin/customers` |

---

## REST API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create customer account |
| POST | `/api/auth/login` | public | Sign in → JWT access token |
| GET | `/api/auth/captcha-config` | public | Public Turnstile widget settings only |
| GET | `/api/auth/me` | user | Current user + profile |
| POST | `/api/auth/forgot-password` | public | Email a 6-digit reset code (dev returns code) |
| POST | `/api/auth/reset-password` | public | Consume code + set new password |
| POST | `/api/admin/customers/:id/reset-code` | admin | Generate a shareable 6-digit reset code |
| GET/PUT | `/api/profile` | user | Read / update profile & style preferences |
| POST | `/api/profile/change-password` | user | Change password |
| GET | `/api/products` | public | List / search / filter / sort / paginate |
| GET | `/api/products/meta` | public | Filter options (categories, colors) |
| GET | `/api/products/:id` | public | Product detail + related |
| GET/POST | `/api/cart` | user | Read / add to cart |
| PATCH/DELETE | `/api/cart/:cartId` | user | Update / remove line |
| GET/POST | `/api/orders` | user | Order history / place order |
| GET | `/api/orders/:id` | user | Order detail |
| POST | `/api/orders/:id/cancel` | user | Cancel pending order (restocks) |
| POST | `/api/stylist/recommend` | public* | AI recommendations (multipart, optional photo) |
| GET | `/api/admin/stats` | admin | Dashboard metrics & sales statistics |
| GET/POST/PUT/DELETE | `/api/admin/products` | admin | Product management |
| PUT | `/api/admin/inventory/:id` | admin | Set or adjust stock |
| GET | `/api/admin/orders` | admin | All orders |
| PUT | `/api/admin/orders/:id/status` | admin | Update order status |
| GET | `/api/admin/customers` | admin | Customers + spend |

\* `/api/stylist/recommend` is public but pre-fills preferences from the customer's saved profile
when a valid JWT is sent.

---

## Project structure

```
elegai/
├── README.md
├── setup.sh                  # one-command Ubuntu/Debian setup
├── docker-compose.yml        # MySQL 8 for local dev
├── backend/
│   ├── .env.example
│   ├── sql/
│   │   ├── schema.sql        # full database schema
│   │   └── seed.sql          # 24 products + demo users (bcrypt hashes)
│   ├── public/images/        # product & hero imagery
│   └── src/
│       ├── server.js / app.js
│       ├── config/           # env, db pool, initDb (auto schema+seed), seedOrders
│       ├── middleware/       # auth, optionalAuth, error, rateLimit, upload
│       ├── controllers/      # HTTP request/response functions by feature
│       ├── routes/           # one router per resource
│       ├── repositories/     # SQL / persistence isolated by feature
│       ├── services/         # AI (Gemini/OpenAI/local) + recommendation engine
│       └── utils/            # errors, asyncHandler, validators, tokens, serialize
└── frontend/
    ├── vite.config.js        # dev proxy → backend
    ├── tailwind.config.js    # ivory / charcoal / gold palette, display font
    └── src/
        ├── api/              # axios client + interceptors
        ├── context/          # AuthContext, CartContext
        ├── components/       # Navbar, Footer, ProductCard, states, badges…
        ├── pages/            # all customer pages
        │   └── admin/        # admin console pages
        ├── utils/            # formatting + shared option lists
        └── styles/           # Tailwind + component classes
```

## Database schema (summary)

`users`, `customer_profiles`, `products`, `cart`, `orders`, `order_items`, `password_reset_tokens`
— see `backend/sql/schema.sql` for the full DDL.

Order statuses: `Pending → Confirmed → Processing → Shipped → Delivered` (+ `Cancelled`).

## Notes & scope

- **MVP scope:** no virtual try-on, no real payment gateway, no complex computer vision.
  Checkout is simulated (COD / GCash / Card demo) and order tracking is a status timeline.
- Product photos are static assets served from `backend/public/images`; admins can upload photos per product
  through the admin console (validated uploads stored under `backend/uploads`). The current Gemini integration
  handles stylist recommendations and optional photo analysis; it does **not** generate images at runtime.
- Password reset codes are sent over SMTP. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASS` and `MAIL_FROM` in `backend/.env`. If SMTP is not configured, the code is returned
  in the API response in development only, and an admin can generate a code for any customer from
  **Admin → Customers** in production. `APP_URL` is not needed for resets because the user enters
  the code instead of clicking a link.
