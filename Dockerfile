FROM node:22-alpine AS builder

WORKDIR /app

# Vite bakes these at build time. Pass via compose `build.args` on the VPS.
ARG VITE_API_BASE_URL
ARG VITE_FILE_STORAGE_URL
ARG VITE_SOCKET_URL
ARG VITE_APP_NAME
ARG VITE_TURNSTILE_SITE_KEY
# Legacy alias still referenced in a few helpers
ARG VITE_API_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_FILE_STORAGE_URL=$VITE_FILE_STORAGE_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY \
    VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
