.DEFAULT_GOAL := help
COMPOSE := docker compose
PNPM := corepack pnpm
LOCAL_UID ?= $(shell id -u)
LOCAL_GID ?= $(shell id -g)
RUN := $(COMPOSE) run --rm --user $(LOCAL_UID):$(LOCAL_GID) web
TEST := $(COMPOSE) run --rm --user $(LOCAL_UID):$(LOCAL_GID) -e DJANGO_SETTINGS_MODULE=config.settings.test web
INOTIFY_WATCH_LIMIT := $(shell cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo 0)

.PHONY: help build up deploy-config deploy-staging deploy-production down restart logs ps shell bash migrate migrations superuser test test-unit test-integration lint format format-check typecheck check db-shell django-shell clean bootstrap frontend-install frontend-dev frontend-build frontend-test frontend-typecheck admin admin-dev admin-build admin-test mobile mobile-start mobile-start-tunnel mobile-watch-check mobile-web mobile-android mobile-ios mobile-lint mobile-build mobile-build-android mobile-build-ios mobile-build-web schema clients-check

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make <target>\n\n"} /^[a-zA-Z_-]+:.*## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build application images
	$(COMPOSE) build

up: ## Start all development services
	$(COMPOSE) up -d

deploy-config: ## Validate the deployment compose file against the staging example env
	TAMVA_ENV_FILE=.env.staging.example $(COMPOSE) -f docker-compose.deploy.yml --env-file .env.staging.example config --quiet

deploy-staging: ## Build and start the staging stack (needs .env.staging)
	TAMVA_ENV_FILE=.env.staging $(COMPOSE) -f docker-compose.deploy.yml --env-file .env.staging -p tamva-stg up -d --build

deploy-production: ## Build and start the production stack (needs .env.production)
	TAMVA_ENV_FILE=.env.production $(COMPOSE) -f docker-compose.deploy.yml --env-file .env.production -p tamva-prod up -d --build

down: ## Stop development services
	$(COMPOSE) down

restart: ## Restart development services
	$(COMPOSE) restart

logs: ## Follow service logs
	$(COMPOSE) logs -f

ps: ## Show service state
	$(COMPOSE) ps

shell: ## Open a Django shell
	$(COMPOSE) exec web python apps/backend/manage.py shell

bash: ## Open a shell in the web container
	$(COMPOSE) exec web sh

migrate: ## Apply database migrations
	$(RUN) python apps/backend/manage.py migrate

migrations: ## Create host-owned database migrations
	$(RUN) python apps/backend/manage.py makemigrations

superuser: ## Create a Django superuser
	$(COMPOSE) exec web python apps/backend/manage.py createsuperuser

test: ## Run the complete test suite
	$(TEST) sh -c 'cd apps/backend && pytest'
	$(PNPM) test

test-unit: ## Run unit tests
	$(TEST) sh -c 'cd apps/backend && pytest -m unit'

test-integration: ## Run integration tests
	$(TEST) sh -c 'cd apps/backend && pytest -m integration'

lint: ## Run Ruff lint checks
	$(RUN) ruff check apps/backend

format: ## Format Python code
	$(RUN) ruff format apps/backend

format-check: ## Check Python formatting without changes
	$(RUN) ruff format --check apps/backend

typecheck: ## Run mypy
	$(RUN) sh -c 'cd apps/backend && mypy config domains packages'

check: ## Run all static and Django checks
	$(RUN) ruff check apps/backend
	$(RUN) ruff format --check apps/backend
	$(RUN) sh -c 'cd apps/backend && mypy config domains packages'
	$(RUN) python apps/backend/manage.py check
	$(PNPM) run lint
	$(PNPM) run typecheck
	$(PNPM) run build

frontend-install: ## Install locked web and mobile dependencies
	$(PNPM) install --frozen-lockfile

frontend-dev: admin-dev ## Run the admin web app with HMR on port 3000

frontend-build: ## Build the admin web application for production
	$(PNPM) run build

frontend-test: ## Run the admin web application test suite
	$(PNPM) test

frontend-typecheck: ## Type-check the admin web app and mobile app
	$(PNPM) run typecheck

admin-dev: ## Run the admin web app with HMR on port 3000
	$(PNPM) run dev:admin

admin: admin-dev ## Run the admin web app

admin-build: ## Build the admin web app for production
	$(PNPM) --filter @tamva/admin build

admin-test: ## Run the admin web app test suite
	$(PNPM) --filter @tamva/admin test

mobile-watch-check:
	@if [ "$(INOTIFY_WATCH_LIMIT)" -lt 262144 ]; then \
		echo "Expo needs more Linux file watchers (current limit: $(INOTIFY_WATCH_LIMIT))."; \
		echo "Run once: sudo sysctl -w fs.inotify.max_user_watches=524288"; \
		echo "Persist: echo fs.inotify.max_user_watches=524288 | sudo tee /etc/sysctl.d/99-tamva.conf"; \
		exit 1; \
	fi

mobile-start: mobile-watch-check ## Start the Expo development server
	$(PNPM) run dev:mobile

mobile-start-tunnel: mobile-watch-check ## Start Expo with a tunnel for remote devices
	$(PNPM) --filter @tamva/mobile start -- --tunnel

mobile: mobile-start ## Run the customer Expo app

mobile-web: mobile-watch-check ## Start the customer app for web
	$(PNPM) --filter @tamva/mobile web

mobile-android: mobile-watch-check ## Start the Expo Android workflow
	$(PNPM) --filter @tamva/mobile android

mobile-ios: mobile-watch-check ## Start the Expo iOS workflow (macOS required for simulator)
	$(PNPM) --filter @tamva/mobile ios

mobile-lint: ## Lint the cross-platform customer app
	$(PNPM) --filter @tamva/mobile lint

mobile-build: ## Export the customer app for Android, iOS, and web
	$(PNPM) --filter @tamva/mobile export

mobile-build-android: ## Export the customer Android bundle
	$(PNPM) --filter @tamva/mobile export:android

mobile-build-ios: ## Export the customer iOS bundle
	$(PNPM) --filter @tamva/mobile export:ios

mobile-build-web: ## Export the customer web build
	$(PNPM) --filter @tamva/mobile export:web

schema: ## Refresh the checked OpenAPI contract
	$(RUN) python apps/backend/manage.py spectacular --file packages/contracts/openapi/schema.yml

clients-check: frontend-typecheck frontend-test frontend-build mobile-lint mobile-build ## Verify both clients and every customer target

db-shell: ## Open a PostgreSQL shell
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-tamva} -d $${POSTGRES_DB:-tamva}

django-shell: shell ## Alias for shell

clean: ## Remove local caches and stopped containers (keeps database volume)
	find . -type d \( -name __pycache__ -o -name .pytest_cache -o -name .mypy_cache -o -name .ruff_cache \) -prune -exec rm -rf {} +
	find apps/admin apps/mobile -type d -name dist -prune -exec rm -rf {} +
	$(COMPOSE) down --remove-orphans

bootstrap: ## Initialize environment, build, start, migrate, and check
	@test -f .env || cp .env.example .env
	$(MAKE) frontend-install
	$(COMPOSE) build
	$(COMPOSE) up -d postgres redis
	$(RUN) python apps/backend/manage.py migrate
	$(RUN) python apps/backend/manage.py check
	$(COMPOSE) up -d web celery-worker admin
