FROM node:24-alpine AS builder

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY contracts/client/package.json contracts/client/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/customer/package.json frontend/customer/package.json
COPY mobile/package.json mobile/package.json
RUN npm ci

COPY contracts/client contracts/client
COPY frontend/customer frontend/customer
RUN npm run build --workspace @tamva/customer

FROM nginx:1.29-alpine

COPY frontend/customer/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/frontend/customer/dist /usr/share/nginx/html

EXPOSE 80
