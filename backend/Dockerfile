# ElegAI API — production image (deployed to Render / Railway / any container host)
# Build context: ./backend
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

# The app auto-creates the schema and seeds the catalog on first boot
# (DB_HOST etc. come from environment variables).
CMD ["node", "src/server.js"]
