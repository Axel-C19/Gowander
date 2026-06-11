.PHONY: help setup dev-backend dev-mobile db-migrate db-seed test lint clean

VENV        := $(CURDIR)/apps/backend/.venv
PYTHON      := $(VENV)/bin/python
PIP         := $(VENV)/bin/pip
ALEMBIC     := $(VENV)/bin/alembic
PYTEST      := $(VENV)/bin/pytest
RUFF        := $(VENV)/bin/ruff
PYTHON_BIN  := $(shell command -v python3 2>/dev/null || command -v python 2>/dev/null)

help:
	@echo "GoWander development commands"
	@echo ""
	@echo "  make setup          Install all dependencies"
	@echo "  make dev-backend    Start backend with Docker"
	@echo "  make dev-mobile     Start Expo dev server"
	@echo "  make db-migrate     Run Alembic migrations"
	@echo "  make db-seed        Seed development data"
	@echo "  make test           Run all tests"
	@echo "  make lint           Lint all workspaces"
	@echo "  make clean          Remove build artifacts"

setup:
	@if [ -z "$(PYTHON_BIN)" ]; then \
		echo "Error: python3 not found. Install from https://python.org"; \
		exit 1; \
	fi
	@echo "Creating Python virtual environment..."
	$(PYTHON_BIN) -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r apps/backend/requirements.txt
	@echo "Installing Node dependencies..."
	npm install --legacy-peer-deps
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example"; fi
	@echo ""
	@echo "✓ Setup complete. Run 'make dev-backend' to start."

dev-backend:
	docker compose -f infra/docker/docker-compose.dev.yml up

dev-mobile:
	npm run start --workspace=apps/mobile

db-migrate:
	cd apps/backend && $(ALEMBIC) upgrade head

db-seed:
	cd apps/backend && $(PYTHON) -m app.db.seed

test:
	npm run test --workspaces --if-present
	cd apps/backend && $(PYTEST) tests/ -v --tb=short

lint:
	npm run lint --workspaces --if-present
	$(RUFF) check apps/backend/

clean:
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null; true
	find . -name "dist" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null; true
	rm -rf $(VENV)