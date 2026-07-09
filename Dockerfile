# Stage 1: Build project bằng Node.js
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency files trước để tận dụng cache
COPY package.json package-lock.json ./

RUN npm ci

# Copy source code
COPY . .

RUN npm run lint --if-present
RUN npm run build

# Xác nhận Vite đã tạo output
RUN test -f /app/dist/index.html


# Stage 2: Chỉ chạy website bằng Nginx
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK \
    --interval=30s \
    --timeout=3s \
    --start-period=10s \
    --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1