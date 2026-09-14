FROM node:24-alpine AS builder

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY contracts/client/package.json contracts/client/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY mobile/package.json mobile/package.json
RUN npm ci

COPY contracts/client contracts/client
COPY frontend/admin frontend/admin
RUN npm run build --workspace @tamva/admin

FROM nginx:1.29-alpine

COPY frontend/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/admin/dist /usr/share/nginx/html
EXPOSE 80
