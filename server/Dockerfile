# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules from builder (includes prisma CLI + generated client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma

EXPOSE 5000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
