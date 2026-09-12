.DEFAULT_GOAL := help
COMPOSE := docker compose
LOCAL_UID ?= 1000
LOCAL_GID ?= 1000
RUN := $(COMPOSE) run --rm --user $(LOCAL_UID):$(LOCAL_GID) web
TEST := $(COMPOSE) run --rm --user $(LOCAL_UID):$(LOCAL_GID) -e DJANGO_SETTINGS_MODULE=config.settings.test web

.PHONY: help build up up-staging up-production down restart logs ps shell bash migrate migrations superuser test test-unit test-integration lint format format-check typecheck check db-shell django-shell clean bootstrap

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

db-shell: ## Open a PostgreSQL shell
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-tamva} -d $${POSTGRES_DB:-tamva}

django-shell: shell ## Alias for shell

clean: ## Remove local caches and stopped containers (keeps database volume)
	find . -type d \( -name __pycache__ -o -name .pytest_cache -o -name .mypy_cache -o -name .ruff_cache \) -prune -exec rm -rf {} +
	$(COMPOSE) down --remove-orphans

bootstrap: ## Initialize environment, build, start, migrate, and check
	@test -f .env || cp .env.example .env
	$(COMPOSE) build
	$(COMPOSE) up -d postgres redis
	$(RUN) python manage.py migrate
	$(RUN) python manage.py check
	$(COMPOSE) up -d web celery-worker
