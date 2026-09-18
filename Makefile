.DEFAULT_GOAL := help
COMPOSE := docker compose
LOCAL_UID ?= 1000
LOCAL_GID ?= 1000
RUN := $(COMPOSE) run --rm --user $(LOCAL_UID):$(LOCAL_GID) web
TEST := $(COMPOSE) run --rm --user $(LOCAL_UID):$(LOCAL_GID) -e DJANGO_SETTINGS_MODULE=config.settings.test web

.PHONY: help build up up-staging up-production down restart logs ps shell bash migrate migrations superuser test test-unit test-integration lint format format-check typecheck check db-shell django-shell clean bootstrap frontend-install frontend-dev frontend-build frontend-test frontend-typecheck admin admin-dev admin-build admin-test mobile mobile-start mobile-web mobile-android mobile-ios mobile-lint mobile-build mobile-build-android mobile-build-ios mobile-build-web schema clients-check

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make <target>\n\n"} /^[a-zA-Z_-]+:.*## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build application images
	$(COMPOSE) build

up: ## Start all development services
	$(COMPOSE) up -d

up-staging: ## Start the staging services
	$(COMPOSE) -f docker-compose.yml -f docker-compose.staging.yml up -d

up-production: ## Start the production services
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d

down: ## Stop development services
	$(COMPOSE) down

restart: ## Restart development services
	$(COMPOSE) restart

logs: ## Follow service logs
	$(COMPOSE) logs -f

ps: ## Show service state
	$(COMPOSE) ps

shell: ## Open a Django shell
	$(COMPOSE) exec web python manage.py shell

bash: ## Open a shell in the web container
	$(COMPOSE) exec web sh

migrate: ## Apply database migrations
	$(RUN) python manage.py migrate

migrations: ## Create database migrations
	$(RUN) python manage.py makemigrations

superuser: ## Create a Django superuser
	$(COMPOSE) exec web python manage.py createsuperuser

test: ## Run the complete test suite
	$(TEST) pytest
	npm test

test-unit: ## Run unit tests
	$(TEST) pytest -m unit

test-integration: ## Run integration tests
	$(TEST) pytest -m integration

lint: ## Run Ruff lint checks
	$(RUN) ruff check .

format: ## Format Python code
	$(RUN) ruff format .

format-check: ## Check Python formatting without changes
	$(RUN) ruff format --check .

typecheck: ## Run mypy
	$(RUN) mypy apps packages config

check: ## Run all static and Django checks
	$(RUN) ruff check .
	$(RUN) ruff format --check .
	$(RUN) mypy apps packages config
	$(RUN) python manage.py check
	npm run lint
	npm run typecheck
	npm run build

frontend-install: ## Install locked web and mobile dependencies
	npm ci

frontend-dev: admin-dev ## Run the admin web app with HMR on port 3000

frontend-build: ## Build the admin web application for production
	npm run build

frontend-test: ## Run the admin web application test suite
	npm test

frontend-typecheck: ## Type-check the admin web app and mobile app
	npm run typecheck

admin-dev: ## Run the admin web app with HMR on port 3000
	npm run dev:admin

admin: admin-dev ## Run the admin web app

admin-build: ## Build the admin web app for production
	npm run build --workspace @tamva/admin

admin-test: ## Run the admin web app test suite
	npm run test --workspace @tamva/admin

mobile-start: ## Start the Expo development server
	npm run dev:mobile

mobile: mobile-start ## Run the customer Expo app

mobile-web: ## Start the customer app for web
	npm run web --workspace @tamva/mobile

mobile-android: ## Start the Expo Android workflow
	npm run android --workspace @tamva/mobile

mobile-ios: ## Start the Expo iOS workflow (macOS required for simulator)
	npm run ios --workspace @tamva/mobile

mobile-lint: ## Lint the cross-platform customer app
	npm run lint --workspace @tamva/mobile

mobile-build: ## Export the customer app for Android, iOS, and web
	npm run export --workspace @tamva/mobile

mobile-build-android: ## Export the customer Android bundle
	npm run export:android --workspace @tamva/mobile

mobile-build-ios: ## Export the customer iOS bundle
	npm run export:ios --workspace @tamva/mobile

mobile-build-web: ## Export the customer web build
	npm run export:web --workspace @tamva/mobile

schema: ## Refresh the checked OpenAPI contract
	$(RUN) python manage.py spectacular --file contracts/openapi/schema.yml

clients-check: frontend-typecheck frontend-test frontend-build mobile-lint mobile-build ## Verify both clients and every customer target

db-shell: ## Open a PostgreSQL shell
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-tamva} -d $${POSTGRES_DB:-tamva}

django-shell: shell ## Alias for shell

clean: ## Remove local caches and stopped containers (keeps database volume)
	find . -type d \( -name __pycache__ -o -name .pytest_cache -o -name .mypy_cache -o -name .ruff_cache \) -prune -exec rm -rf {} +
	find frontend mobile -type d -name dist -prune -exec rm -rf {} +
	$(COMPOSE) down --remove-orphans

bootstrap: ## Initialize environment, build, start, migrate, and check
	@test -f .env || cp .env.example .env
	npm ci
	$(COMPOSE) build
	$(COMPOSE) up -d postgres redis
	$(RUN) python manage.py migrate
	$(RUN) python manage.py check
	$(COMPOSE) up -d web celery-worker admin
