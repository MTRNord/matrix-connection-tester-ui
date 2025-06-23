# Build stage
FROM node:24-bookworm AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
# Install dependencies (prefer pnpm, fallback to npm)
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      npm install -g yarn && yarn install --frozen-lockfile; \
    else \
      npm install --frozen-lockfile; \
    fi

COPY . .

RUN npm run build

# Production stage
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a default nginx config for SPA routing
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]