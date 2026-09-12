FROM node:24-alpine AS builder

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY contracts/client/package.json contracts/client/package.json
COPY frontend/institution-web/package.json frontend/institution-web/package.json
COPY mobile/customer-app/package.json mobile/customer-app/package.json
RUN npm ci

COPY contracts/client contracts/client
COPY frontend/institution-web frontend/institution-web
RUN npm run build --workspace @tamva/institution-web

FROM nginx:1.29-alpine

COPY frontend/institution-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/frontend/institution-web/dist /usr/share/nginx/html
EXPOSE 80
