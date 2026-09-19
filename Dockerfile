# syntax=docker/dockerfile:1
# Backend image (web, celery worker, celery beat share it). Multi-stage:
#   builder     runtime dependencies only
#   builder-dev + test/lint tooling (development target only)
#   dev         bind-mounted source for local work: `target: dev`
#   runtime     the deployable image (default target): source only, non-root, no tooling

FROM python:3.13-slim AS builder
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
WORKDIR /build
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY apps/backend/requirements.lock .
RUN pip install --upgrade pip && pip install -r requirements.lock

FROM builder AS builder-dev
COPY apps/backend/requirements-dev.lock .
RUN pip install -r requirements-dev.lock

FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH="/opt/venv/bin:$PATH" PYTHONPATH="/app/apps/backend"
RUN groupadd --system tamva && useradd --system --gid tamva --create-home tamva
WORKDIR /app

FROM base AS dev
COPY --from=builder-dev /opt/venv /opt/venv
COPY --chown=tamva:tamva . .
RUN chmod +x /app/scripts/entrypoint.sh
USER tamva
EXPOSE 8000
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["python", "apps/backend/manage.py", "runserver", "0.0.0.0:8000"]

FROM base AS runtime
COPY --from=builder /opt/venv /opt/venv
COPY --chown=tamva:tamva VERSION /app/VERSION
COPY --chown=tamva:tamva scripts /app/scripts
COPY --chown=tamva:tamva apps/backend /app/apps/backend
RUN chmod +x /app/scripts/entrypoint.sh
# Build metadata surfaced by GET /api/v1/meta/version/ (never secrets).
ARG APP_RELEASE=""
ENV APP_RELEASE=${APP_RELEASE}
USER tamva
EXPOSE 8000
# Liveness only (process answers). Dependencies are checked by /health/ready/ at the orchestrator.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["python", "/app/scripts/healthcheck.py", "/health/live/"]
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--access-logfile", "-"]
