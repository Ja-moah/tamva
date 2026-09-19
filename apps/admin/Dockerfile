# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder

WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/client/package.json packages/contracts/client/package.json
COPY packages/brand/package.json packages/brand/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY packages packages
COPY apps/admin apps/admin
RUN pnpm --filter @tamva/admin build

FROM caddy:2-alpine
COPY apps/admin/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /workspace/apps/admin/dist /srv
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD ["wget", "--quiet", "--spider", "http://127.0.0.1/"]
