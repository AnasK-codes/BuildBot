# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# Next.js uses PORT env var
ENV PORT 3000

# Run migrations and start app
CMD npx prisma migrate deploy && npm start
