# Makefile for quick temporary Docker-based setup commands
# Uses ephemeral containers to bootstrap and install frontend/backend projects.

.PHONY: help frontend-setup backend-setup setup-all

help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  frontend-setup    Create frontend app if needed and install Bun dependencies"
	@echo "  backend-setup     Create backend app if needed and restore .NET dependencies"
	@echo "  setup-all         Run both frontend-setup and backend-setup"

frontend-setup:
	@mkdir -p frontend
	@if [ ! -f frontend/package.json ]; then \
		echo "Creating React frontend project..."; \
		docker run --rm -it \
			-v "$(PWD)/frontend":/app \
			-w /app \
			oven/bun:latest \
			bun create vite . -- --template react-ts; \
	fi
	@echo "Installing frontend dependencies..."
	docker run --rm -it \
		-v "$(PWD)/frontend":/app \
		-w /app \
		oven/bun:latest \
		bun install

backend-setup:
	@mkdir -p backend
	@if ! ls backend/*.csproj >/dev/null 2>&1; then \
		echo "Creating .NET backend project..."; \
		docker run --rm -it \
			-v "$(PWD)/backend":/app \
			-w /app \
			mcr.microsoft.com/dotnet/sdk:10.0 \
			dotnet new webapi --no-https; \
	fi
	@echo "Restoring backend dependencies..."
	docker run --rm -it \
		-v "$(PWD)/backend":/app \
		-w /app \
		mcr.microsoft.com/dotnet/sdk:10.0 \
		dotnet restore

setup-all: frontend-setup backend-setup
