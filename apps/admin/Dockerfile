FROM node:24-alpine AS builder

WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/client/package.json packages/contracts/client/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/contracts/client packages/contracts/client
COPY apps/admin apps/admin
RUN pnpm --filter @tamva/admin build

FROM nginx:1.29-alpine

COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/admin/dist /usr/share/nginx/html
EXPOSE 80
