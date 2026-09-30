# ========================================
# Stage 1: Base Image
# ========================================
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git

# ========================================
# Stage 2: Dependencies
# ========================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# ========================================
# Stage 3: Production
# ========================================
FROM base AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Expose port (the app reads PORT, default 5000)
ENV PORT=5000
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]