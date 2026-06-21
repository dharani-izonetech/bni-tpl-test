# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build args
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_WS_BASE_URL=wss://bnicricket.com/ws
ARG VITE_SITE_URL=https://bnicricket.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build:prod

# ── Stage 2: Serve with Nginx ──────────────────────────────────
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing + security headers + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
