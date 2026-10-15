# ─────────────────────────────────────────────────────────────────────────────
# ElegAI — single container: built web app + API server
# Deploy target: Back4app Containers (free tier, NO credit card) or any Docker host.
#
# This builds the React frontend, then runs the Express API which serves
# BOTH the REST API and the built website (SERVE_FRONTEND=true) — one URL,
# one container, nothing else to configure.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build the frontend ──────────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: runtime — Express API serving API + website ────────────────────
FROM node:20-slim AS runtime
WORKDIR /app

# Backend dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Backend source
COPY backend/ ./

# Built frontend (so the API can serve the website at the same URL)
COPY --from=frontend-build /build/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV SERVE_FRONTEND=true

EXPOSE 5000
CMD ["node", "src/server.js"]
