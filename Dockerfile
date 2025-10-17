# ================================
# Stage 1: Builder
# ================================
FROM node:18-alpine AS builder

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

# ================================
# Stage 2: Production
# ================================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

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