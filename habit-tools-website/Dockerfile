# habit-tools-website – Next.js in Docker, dauerhaft mit dem Stack
# Multi-Stage: Build → Production

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# --- Stage 2: Production ---
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
