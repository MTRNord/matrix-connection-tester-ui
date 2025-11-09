# Build stage - force x86_64/amd64 to avoid ARM64 emulation issues during Vite build
FROM --platform=linux/amd64 denoland/deno:ubuntu-2.5.6 AS builder

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app

# Copy source files
COPY . .

# Install dependencies and build on x86_64
RUN deno install --allow-scripts
RUN deno task build

# Runtime stage - use target platform (will be amd64 or arm64)
FROM denoland/deno:ubuntu-2.5.6

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

EXPOSE 8000

WORKDIR /app

# Copy source files (needed for runtime imports)
COPY --chown=deno:deno . .

# Copy built artifacts from builder stage
COPY --from=builder --chown=deno:deno /app/_fresh /app/_fresh

# Reinstall dependencies for target platform (native modules may differ)
RUN deno install --allow-scripts

# Cache the server entrypoint for target platform
RUN deno cache _fresh/server.js

USER deno

ENV TERM=xterm-256color
ENV DENO_NO_UPDATE_CHECK=disable

CMD ["serve", "-A", "_fresh/server.js"]
