# ================================
# Stage 1: Builder
# ================================
FROM node:18-alpine AS builder

# Install system dependencies required for canvas package
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    fontconfig-dev

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy only necessary source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Strip dev dependencies to reduce final image size
RUN npm prune --production

# ================================
# Stage 2: Production
# ================================
FROM node:18-alpine

# Install runtime dependencies required for canvas package
# Python is needed for building native modules like canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    fontconfig

# Set working directory
WORKDIR /app

# Copy production node_modules and built app from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create logs and data directories
RUN mkdir -p logs data && \
    chown -R node:node /app

# Use non-root user (node user is built-in on alpine)
USER node

# Expose port (if needed for health checks)
EXPOSE 3000

# Optimized health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Start the bot
CMD ["node", "dist/index.js"]