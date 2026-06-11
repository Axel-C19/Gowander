# GoWander — QA Plan & Report (ISW112)

Maps every course unit to concrete, verifiable artifacts in this repository.

## Scope under test
GoWander MVP: auth (R-01/02), preferences (R-03), destinations (R-04),
swipe deck (R-05/06), itinerary engine (R-07), maps (R-08), saved trips (R-09).
Excluded by project definition: password recovery, advanced profile
customization, custom favorite lists, open public registration.

## Unidad I — Errores, fallas y defectos
- Terminology applied per-incident in [DEFECT_LOG.md](DEFECT_LOG.md):
  every entry separates the **error** (human mistake), the **defect**
  (flaw in the artifact) and the **failure** (observable misbehavior).
- 6 real defects found and fixed during development, 4 with permanent
  regression tests.

## Unidad II — Tipos de pruebas

| § | Type | Where | Count |
|---|------|-------|-------|
| 2.1 | **Funcionales** | `tests/integration/` — auth, preferences, destinations/search/places, swipe sessions+actions, itinerary generate (single & multi-day), save/list | ~45 |
| 2.2 | **No funcionales** | `tests/nonfunctional/` — performance budgets (engine <2s @50 places, list <500ms, login <1s) and security (auth enforcement on every endpoint, malformed/forged tokens, cross-user isolation, password never exposed, weak password rejected) | ~15 |
| 2.3 | **Estructurales** (caja blanca) | `tests/unit/test_itinerary_engine.py` — haversine, nearest-neighbour, opening-hours predicate, time formatting; branch-level cases (missing data, closed days, late opening) | ~14 |
| 2.4 | **Pruebas de cambios** (regresión) | `tests/regression/` — one file per historical defect (GW-001, GW-002, GW-003); run on every CI push so the bugs cannot silently return | 7 |
| 2.5 | **Manuales y automáticas** | Automated: 74 pytest cases in CI (GitHub Actions). Manual: [MANUAL_TEST_PLAN.md](MANUAL_TEST_PLAN.md) — 24 scripted device checks covering UX/gesture/visual behavior automation can't reach | 74 + 24 |

## Unidad III — Seguimiento (tracking)
- Tool: versioned [DEFECT_LOG.md](DEFECT_LOG.md) + git commit references,
  mirrored to GitHub Issues (`Axel-C19/Gowander`).
- Workflow: failure observed → reproduced with a test → root cause →
  fix → regression test → log entry closed.

## Unidad IV — Proyecto aplicando técnicas de calidad
- The GoWander app itself is the Unidad IV project: every feature
  (R-01…R-09) ships with functional coverage; quality gates run in CI.
- Selected models/techniques: pyramid testing (unit → integration →
  E2E manual), regression-per-defect policy, security-by-default
  (every endpoint authenticated, ownership checks), defect taxonomy
  (error/defecto/falla) on all incidents.

## How to run
```bash
cd apps/backend
.venv/bin/pytest tests/ -v          # everything
.venv/bin/pytest tests/regression/  # regression suite only
```

## Current status
**74/74 automated tests passing.** Manual plan executed on iPhone (Expo Go);
see checklist for per-case results.
