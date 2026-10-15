# ElegAI project structure guide

The source is split by responsibility so features are easier to find and update. The UI/API behavior is intended to stay the same, but database access has been moved out of controllers into feature repositories. CAPTCHA, stronger rate limits, and token hardening have also been added.

## Main folders

```text
ElegAI/
├── backend/
│   ├── sql/                 # Database schema and starter data
│   └── src/
│       ├── config/          # Environment, database connection, DB initialization
│       ├── routes/          # API URL definitions, grouped by feature
│       ├── controllers/     # Request-handling functions, grouped by feature
│       ├── services/        # Reusable business logic (AI and recommendations)
│       ├── repositories/    # Feature-specific SQL/persistence; controllers never import DB
│       ├── middleware/      # Authentication, CAPTCHA, rate limits, upload, error handling
│       └── utils/           # Shared helpers and validation
├── frontend/
│   └── src/
│       ├── api/             # Frontend-to-backend API client
│       ├── components/      # Reusable UI pieces
│       ├── context/         # Shared login and cart state
│       ├── pages/           # Customer screens; admin screens are in pages/admin/
│       ├── styles/          # Global styles and Tailwind styles
│       └── utils/           # Shared formatting and option lists
├── mobile/                  # Optional React Native / Expo client
├── jira/                    # JIRA epic/story guide and import CSV
└── PROJECT-STRUCTURE.md     # This file
```

## Where to edit a feature

| Feature / task | Main files to look at |
|---|---|
| Sign up, sign in, password reset | `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth.controller.js`, `frontend/src/pages/` |
| Customer profile and preferences | `backend/src/routes/user.routes.js`, `backend/src/controllers/user.controller.js`, `frontend/src/pages/Profile.jsx` |
| Product catalog and product details | `backend/src/routes/product.routes.js`, `backend/src/controllers/product.controller.js`, `frontend/src/pages/Catalog.jsx`, `frontend/src/pages/ProductDetails.jsx` |
| AI stylist and recommendations | `backend/src/routes/stylist.routes.js`, `backend/src/controllers/stylist.controller.js`, `backend/src/services/ai.service.js`, `backend/src/services/recommendation.service.js`, `frontend/src/pages/Stylist.jsx` |
| Cart | `backend/src/routes/cart.routes.js`, `backend/src/controllers/cart.controller.js`, `frontend/src/context/CartContext.jsx`, `frontend/src/pages/CartPage.jsx` |
| Orders and checkout | `backend/src/routes/order.routes.js`, `backend/src/controllers/order.controller.js`, `frontend/src/pages/Checkout.jsx`, `frontend/src/pages/Orders.jsx` |
| Admin functions | `backend/src/routes/admin.routes.js`, `backend/src/controllers/admin.controller.js`, `frontend/src/pages/admin/` |
| Database tables and starter data | `backend/sql/schema.sql`, `backend/sql/seed.sql` |
| SQL and persistence operations | `backend/src/repositories/` |
| CAPTCHA, JWT authentication, rate limits | `backend/src/middleware/`, `backend/src/utils/tokens.js`, `frontend/src/components/Captcha.jsx` |
| Shared buttons, navigation, product cards, status UI | `frontend/src/components/` |
| API/database configuration | `backend/src/config/`, environment variables in `backend/.env` |

## How a backend API feature is organized

For example, the product API is split into:

1. `backend/src/routes/product.routes.js` — declares the HTTP endpoints.
2. `backend/src/controllers/product.controller.js` — validates HTTP input and shapes the response.
3. `backend/src/repositories/product.repository.js` — owns product SQL and persistence operations.
4. `backend/src/repositories/database.repository.js` — shared adapter/transaction helper for the database connection.
5. `frontend/src/api/client.js` and `frontend/src/pages/` — call the API and display the feature.

Keep endpoint definitions in `routes/`, request/response handling in `controllers/`, SQL in `repositories/`, cross-feature business logic in `services/`, and reusable UI in `components/`. Avoid putting database credentials, JWT secrets, Turnstile secrets, or AI keys in frontend files.

## Important setup note

The shareable source archive intentionally does **not** contain the private `backend/.env` file. Copy `backend/.env.example` to `backend/.env` and fill in your own database settings and optional AI API key before running the backend. Do not upload or share a real `.env` file.
