# GoWander

Intelligent travel itinerary generation — MVP

## Quick start

### Prerequisites
- Node.js 20+, Yarn 4
- Python 3.12+
- Docker Desktop

### 1. Clone and install
```bash
git clone https://github.com/your-org/gowander
cd gowander
make setup
```

### 2. Start the backend (Docker)
```bash
make dev-backend
# PostgreSQL on :5432
# FastAPI on http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

### 3. Seed the database
```bash
make db-seed
# Demo user: demo@gowander.app / demo1234
```

### 4. Start the mobile app
```bash
make dev-mobile
# Scan the QR with Expo Go
```

---

## Project structure

```
gowander/
├── apps/
│   ├── mobile/          React Native + Expo
│   │   └── src/
│   │       ├── screens/         Auth, Destination, Swipe, Itinerary
│   │       ├── components/      SwipeCard, SwipeButtons, Maps, UI
│   │       ├── navigation/      RootNavigator, AuthStack, AppStack
│   │       ├── store/slices/    Zustand: auth, swipe
│   │       ├── services/        API clients (axios)
│   │       ├── hooks/           React Query hooks
│   │       ├── types/           Navigation types, shared
│   │       └── constants/       Colors, spacing, fonts
│   │
│   └── backend/         FastAPI + Python
│       └── app/
│           ├── api/v1/          Route handlers
│           ├── core/            Config, security (JWT/bcrypt)
│           ├── db/              Session, seed
│           ├── models/          SQLAlchemy ORM models
│           ├── schemas/         Pydantic request/response schemas
│           ├── services/        Business logic (itinerary engine)
│           └── utils/           Pagination, error helpers
│
├── packages/
│   ├── shared-types/    TypeScript API contracts (source of truth)
│   ├── shared-constants/  Endpoints, screen names, query keys
│   └── shared-utils/    Date, formatting, validation helpers
│
├── infra/
│   ├── docker/          Dockerfile.backend, compose dev/test/prod
│   └── scripts/         Migration, deploy utilities
│
└── .github/workflows/   CI: lint + test + EAS preview build
```

## Architecture decisions

| Decision | Choice | Reason |
|---|---|---|
| Mobile framework | React Native + Expo | Zero native build friction for MVP demo |
| State: server data | React Query | Caching, loading states, refetch — out of the box |
| State: client UI | Zustand | Minimal boilerplate, replaces Redux for MVP scale |
| Backend framework | FastAPI | Async, auto OpenAPI docs, Pydantic validation |
| Auth | JWT (HS256) | Stateless, mobile-friendly |
| ORM | SQLAlchemy 2.0 | Type-safe, Alembic migrations |
| Swipe gestures | Reanimated 3 + RNGH | Native thread performance, smooth 60fps |
| Routing algorithm | Greedy nearest-neighbour | Simple, correct for MVP, swappable later |

## Running tests

```bash
# Backend unit + integration
cd apps/backend && pytest -v

# Mobile
npm run test --workspace=apps/mobile

# All (via Docker)
docker compose -f infra/docker/docker-compose.test.yml up --abort-on-container-exit
```

## Milestones

- [x] M0 — Monorepo, architecture, Docker
- [x] M1 — Auth (JWT login, protected routes)
- [x] M2 — Places (destinations, Places API)
- [x] M3 — Swipe engine (gestures, session persistence)
- [x] M4 — Itinerary engine (route optimizer)
- [ ] M5 — Map view (Mapbox/Google Maps route)
- [ ] M6 — QA polish, demo prep
