# ==============================================================================
# QuickPOS Pro — project Makefile
# Run `make` or `make help` to list every target.
#
# Services (docker compose):
#   db        pos-iul-db        Postgres 15   host:9001 -> 5432
#   backend   pos-iul-backend   .NET 10 API   host:9002 -> 8080
#   frontend  pos-iul-frontend  Vite/React    host:9003 -> 5173
# ==============================================================================

COMPOSE  := docker compose
DB       := pos-iul-db
BE       := pos-iul-backend
FE       := pos-iul-frontend

DB_USER  := pos_iul_user
DB_NAME  := pos_iul_db

# psql helpers (i = piped/non-interactive, it = interactive shell)
PSQL     := docker exec -i  $(DB) psql -U $(DB_USER) -d $(DB_NAME)
PSQL_IT  := docker exec -it $(DB) psql -U $(DB_USER) -d $(DB_NAME)

.DEFAULT_GOAL := help
.PHONY: help up dev rebuild build down stop start restart ps status urls \
        logs logs-db logs-be logs-fe restart-be restart-fe \
        db-init db-schema db-seed db-migrate db-reset db-shell db-ready db-dump db-nuke \
        be-shell be-restore be-build \
        fe-shell fe-install fe-typecheck fe-build fe-add \
        fix-perms clean setup frontend-setup backend-setup setup-all

# ------------------------------------------------------------------------------
help: ## Show this help
	@echo "QuickPOS Pro — make targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ------------------------------------------------------------------------------
# Lifecycle
# ------------------------------------------------------------------------------
up: ## Start all services in the background (builds images if missing)
	$(COMPOSE) up -d

dev: ## Start all services in the foreground (live logs, Ctrl-C to stop)
	$(COMPOSE) up

rebuild: ## Rebuild images and start (use after Dockerfile/dependency changes)
	$(COMPOSE) up -d --build

build: ## Build images without starting
	$(COMPOSE) build

down: ## Stop and remove containers
	$(COMPOSE) down

stop: ## Stop containers (keep them)
	$(COMPOSE) stop

start: ## Start previously-stopped containers
	$(COMPOSE) start

restart: ## Restart all services
	$(COMPOSE) restart

restart-be: ## Restart only the backend
	$(COMPOSE) restart backend

restart-fe: ## Restart only the frontend
	$(COMPOSE) restart frontend

ps status: ## Show container status
	$(COMPOSE) ps

urls: ## Print the service URLs
	@echo "Frontend : http://localhost:9003"
	@echo "Backend  : http://localhost:9002      (Swagger UI: http://localhost:9002/swagger)"
	@echo "Postgres : localhost:9001  db=$(DB_NAME) user=$(DB_USER)"

# ------------------------------------------------------------------------------
# Logs
# ------------------------------------------------------------------------------
logs: ## Tail logs from all services
	$(COMPOSE) logs -f --tail=100

logs-db: ## Tail database logs
	docker logs -f --tail=100 $(DB)

logs-be: ## Tail backend logs
	docker logs -f --tail=100 $(BE)

logs-fe: ## Tail frontend logs
	docker logs -f --tail=100 $(FE)

# ------------------------------------------------------------------------------
# Database
# ------------------------------------------------------------------------------
db-ready: ## Wait until Postgres accepts connections
	@until docker exec $(DB) pg_isready -U $(DB_USER) -d $(DB_NAME) >/dev/null 2>&1; do \
		echo "waiting for postgres…"; sleep 1; \
	done; echo "postgres is ready."

db-schema: ## Apply database.sql (tables, sequences, constraints)
	$(PSQL) < database.sql

db-seed: ## Apply seed.sql (demo categories, products, customers)
	$(PSQL) < seed.sql

db-migrate: ## Apply every migrations/*.sql in order (idempotent)
	@for f in $$(ls migrations/*.sql 2>/dev/null | sort); do \
		echo "→ applying $$f"; \
		$(PSQL) < $$f; \
	done

db-init: db-ready db-schema db-seed db-migrate ## First-time DB setup: schema + seed + migrations
	@echo "Database initialised (schema + seed + migrations)."

db-reset: db-ready ## DANGER: drop & recreate schema, then re-seed (wipes data, keeps container)
	@echo "⚠️  Dropping public + auth schemas…"
	@$(PSQL) -c "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA public;"
	@$(MAKE) db-schema db-seed db-migrate
	@echo "Database reset complete."

db-shell: ## Open an interactive psql shell
	$(PSQL_IT)

db-dump: ## Dump the database to backup.sql
	docker exec $(DB) pg_dump -U $(DB_USER) -d $(DB_NAME) > backup.sql
	@echo "Wrote backup.sql"

db-nuke: ## DANGER: stop, delete the Postgres data dir, re-init from scratch
	$(COMPOSE) down
	sudo rm -rf database
	$(COMPOSE) up -d db
	@$(MAKE) db-init

# ------------------------------------------------------------------------------
# Backend (.NET) — runs inside the running backend container
# ------------------------------------------------------------------------------
be-shell: ## Open a shell in the backend container
	docker exec -it $(BE) bash

be-restore: ## dotnet restore inside the backend container
	docker exec $(BE) dotnet restore

be-build: ## dotnet build inside the backend container
	docker exec $(BE) dotnet build

# ------------------------------------------------------------------------------
# Frontend (Bun) — runs inside the running frontend container
# ------------------------------------------------------------------------------
fe-shell: ## Open a shell in the frontend container
	docker exec -it $(FE) sh

fe-install: ## bun install inside the frontend container
	docker exec $(FE) bun install

fe-typecheck: ## Run the TypeScript typecheck inside the frontend container
	docker exec $(FE) bun run typecheck

fe-build: ## Production build inside the frontend container
	docker exec $(FE) bun run build

fe-add: ## Add a dependency: make fe-add PKG="recharts"
	docker exec $(FE) bun add $(PKG)

# ------------------------------------------------------------------------------
# Utilities
# ------------------------------------------------------------------------------
fix-perms: ## Fix root-owned files Docker created (frontend, backend, uploads)
	sudo chown -R $$(id -u):$$(id -g) frontend backend uploads
	@echo "Ownership restored. (database/ is left alone — Postgres must own it.)"

clean: ## Stop containers and remove the built images
	$(COMPOSE) down --rmi local --remove-orphans

# ------------------------------------------------------------------------------
# One-time bootstrap (ephemeral containers — only needed to scaffold from empty)
# ------------------------------------------------------------------------------
frontend-setup: ## Scaffold + install the frontend via an ephemeral Bun container
	@mkdir -p frontend
	@if [ ! -f frontend/package.json ]; then \
		echo "Creating React frontend project..."; \
		docker run --rm -it -v "$(PWD)/frontend":/app -w /app oven/bun:latest \
			bun create vite . -- --template react-ts; \
	fi
	@echo "Installing frontend dependencies..."
	docker run --rm -it -v "$(PWD)/frontend":/app -w /app oven/bun:latest bun install

backend-setup: ## Scaffold + restore the backend via an ephemeral .NET SDK container
	@mkdir -p backend
	@if ! ls backend/*.csproj >/dev/null 2>&1; then \
		echo "Creating .NET backend project..."; \
		docker run --rm -it -v "$(PWD)/backend":/app -w /app mcr.microsoft.com/dotnet/sdk:10.0 \
			dotnet new webapi --no-https; \
	fi
	@echo "Restoring backend dependencies..."
	docker run --rm -it -v "$(PWD)/backend":/app -w /app mcr.microsoft.com/dotnet/sdk:10.0 dotnet restore

setup setup-all: frontend-setup backend-setup ## Bootstrap both projects from empty
