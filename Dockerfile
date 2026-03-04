# Stage 1: Build the frontend
FROM oven/bun:1.3.10-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

# Stage 2: Prepare backend production dependencies
FROM oven/bun:1.3.10-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json backend/bun.lock ./
RUN bun install --production --frozen-lockfile

# Stage 3: Final Runtime
FROM oven/bun:1.3.10-alpine
WORKDIR /app

# Ensure /app is owned by bun
RUN chown bun:bun /app

# Copy production dependencies
COPY --from=backend-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun backend/package.json ./

# Copy backend source logic
COPY --chown=bun:bun backend/src/ ./src
COPY --chown=bun:bun backend/index.ts ./

# Copy built frontend from Stage 1
COPY --from=build-frontend --chown=bun:bun /app/frontend/dist ./frontend/dist

# Set production environment
ENV NODE_ENV=production

# Use a non-root user for security
USER bun

# Expose the port
EXPOSE 3000

# Run the application
CMD ["bun", "run", "index.ts"]
