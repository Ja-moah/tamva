# syntax=docker/dockerfile:1
# Edge image: Caddy + the built Admin SPA + the built customer web app.
# Build context is the repository root. Build in CI or on a workstation, not on the
# small production VPS (the Expo web export needs more memory than the host has to spare).

FROM node:24-alpine AS frontend
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/client/package.json packages/contracts/client/package.json
COPY packages/brand/package.json packages/brand/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN corepack enable && pnpm install --frozen-lockfile
COPY packages packages
COPY apps/admin apps/admin
COPY apps/mobile apps/mobile
# Public by design: EXPO_PUBLIC_* values are compiled into the bundle. No secrets here.
ARG EXPO_PUBLIC_API_BASE_URL
ARG EXPO_PUBLIC_APP_ENV=production
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL} EXPO_PUBLIC_APP_ENV=${EXPO_PUBLIC_APP_ENV}
RUN pnpm --filter @tamva/admin build && pnpm --filter @tamva/mobile export:web

FROM caddy:2-alpine
COPY deploy/edge/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /workspace/apps/admin/dist /srv/admin
COPY --from=frontend /workspace/apps/mobile/dist/web /srv/app
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:8081/healthz"]
