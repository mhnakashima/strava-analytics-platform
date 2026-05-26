.PHONY: dev backend frontend etl install setup

# ── Install dependencies ───────────────────────────────────────────────────────
install:
	cd backend && pip3 install -r requirements.txt
	cd etl && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd frontend && npm install

# ── Run everything locally (hybrid: Neon cloud DB) ────────────────────────────
# Open 3 separate terminals and run each target, OR use the dev target below.

backend:
	cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && npm run dev

etl:
	cd etl && .venv/bin/python runner.py --once

# ── Setup: copies .env.example to .env (only if .env doesn't exist) ───────────
setup:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env — fill in STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET"; fi
	@if [ ! -f frontend/.env.local ]; then echo "VITE_API_URL=http://localhost:8000" > frontend/.env.local; echo "Created frontend/.env.local"; fi
	@ln -sf "$$(pwd)/.env" backend/.env 2>/dev/null && echo "Symlinked backend/.env → .env" || true

# ── Docker Compose (fully local with local PostgreSQL) ────────────────────────
docker-up:
	docker compose up --build

docker-down:
	docker compose down
