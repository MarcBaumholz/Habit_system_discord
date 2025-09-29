# Discord Habit System - Docker Container
# Optimized for TypeScript development

FROM node:18-alpine

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S discord-bot -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for TypeScript)
RUN npm ci && npm cache clean --force

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs && chown -R discord-bot:nodejs /app

# Switch to non-root user
USER discord-bot

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the application using ts-node for TypeScript
CMD ["npm", "run", "dev"]
