# GoWander — Defect Log (Seguimiento de errores, fallas y defectos)

**ISW112 Unidad I & III evidence.** Each entry classifies the issue using the
standard terminology:

- **Error** — the human mistake made while writing the code.
- **Defect (defecto)** — the resulting flaw in the artifact (code/design).
- **Failure (falla)** — the observable misbehavior at runtime that the user sees.

Tracking tool: this versioned log + git history (every fix references a commit).
Mirror entries to GitHub Issues at https://github.com/Axel-C19/Gowander/issues
for the closed/open workflow.

---

## GW-001 — Swipe deck skips cards on fast gestures
| | |
|---|---|
| **Severity** | High (core flow corrupted) |
| **Status** | ✅ Fixed |
| **Failure** | After swiping all cards right, the itinerary contained fewer places than accepted; some cards were skipped without registering. |
| **Defect** | `handleSwipe` in `SwipeDeckScreen.tsx` had no re-entry guard; a second gesture fired before `currentIndex` updated (stale closure). The duplicate API insert violated the DB unique constraint → 500 → the error path *also* advanced the index → one card skipped. Backend compounding defect: the duplicate insert surfaced as an unhandled 500. |
| **Error** | Assuming gesture callbacks are serialized; not handling the unique-constraint violation in the API. |
| **Fix** | `isProcessingSwipe` ref + gesture disabling on the client; API now returns 409 on duplicate (idempotent). |
| **Regression test** | `tests/regression/test_duplicate_swipe.py` |

## GW-002 — Places silently dropped from itineraries
| | |
|---|---|
| **Severity** | High (looked identical to GW-001 from the user's view) |
| **Status** | ✅ Fixed |
| **Failure** | Itinerary for Paris showed only 3 of 5 accepted places. |
| **Defect** | `_is_open_on_day` treated a weekday *missing* from `opening_hours` as closed; seed data only defined 1–2 days per place, so most places were filtered out on most days. |
| **Error** | Conflating "no data" with "closed" in the filter logic; incomplete seed data masked it. |
| **Fix** | Missing day → assume open; only explicit `closed: true` filters. Seed data completed to full weekly hours. |
| **Regression test** | `tests/regression/test_opening_hours_filter.py` |

## GW-003 — Generate request with a travel date always returns 422
| | |
|---|---|
| **Severity** | High (blocked the date feature) |
| **Status** | ✅ Fixed |
| **Failure** | Selecting any travel date produced "Could not generate itinerary"; server log showed 422 `Input should be None`. |
| **Defect** | In `GenerateItineraryRequest`, the field `date: Optional[date]` — the field *name* shadowed the `date` *type* during Pydantic model construction, so the field type resolved to `None`. |
| **Error** | Naming a field identically to its type annotation. |
| **Fix** | Qualified types (`dt.date`); later renamed to `start_date`/`end_date`. |
| **Regression test** | `tests/regression/test_generate_with_date.py` |

## GW-004 — JWT subject passed as string to a UUID column
| | |
|---|---|
| **Severity** | Medium (latent; portability) |
| **Status** | ✅ Fixed |
| **Failure** | `GET /auth/me` crashed (`'str' object has no attribute 'hex'`) on SQLite test runs; worked on PostgreSQL only because psycopg2 coerces strings. |
| **Defect** | `deps.get_current_user` passed the raw JWT `sub` string into `db.get(User, ...)` without parsing or validating it as a UUID. |
| **Error** | Relying on dialect-specific type coercion. |
| **Fix** | `uuid.UUID(...)` parse with `ValueError/TypeError` mapped to 401. |
| **Detected by** | Structural test run (white-box payoff: invalid-subject tokens now also rejected — a security hardening side effect). |

## GW-005 — Test database leaked state between runs
| | |
|---|---|
| **Severity** | Medium (false test failures) |
| **Status** | ✅ Fixed |
| **Failure** | Re-running the suite failed with `UNIQUE constraint failed: users.email`. |
| **Defect** | `conftest.py` claimed in-memory SQLite but used a file (`sqlite:///./test.db`); committed rows survived across runs and tests shared state. |
| **Error** | Copy-paste configuration not matching its own comment. |
| **Fix** | True in-memory DB with `StaticPool` + per-test schema create/drop. |

## GW-006 — Swipe session creation accepted unvalidated input
| | |
|---|---|
| **Severity** | Medium (validation gap, latent crash) |
| **Status** | ✅ Fixed |
| **Failure** | Crashed on SQLite (string into UUID column); on PostgreSQL, malformed bodies produced 500s instead of 422s. |
| **Defect** | `POST /swipe/session` took `body: dict` with no schema — no validation of `destination_id` presence or format. |
| **Error** | Skipping the Pydantic schema for a "simple" endpoint. |
| **Fix** | `SwipeSessionCreate` schema with a typed `destination_id: uuid.UUID`. |
| **Detected by** | Functional test sweep written for Unidad II §2.1 — found *while writing the QA suite*, demonstrating test-driven defect detection. |
