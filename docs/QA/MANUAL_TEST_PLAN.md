# GoWander — Manual Test Plan (ISW112 Unidad II §2.5)

Device checklist for behavior automation can't verify: gestures, animations,
visual states, and cross-screen UX. Execute on a physical iPhone via Expo Go.
Mark each case ✅/❌ with date; failures get a DEFECT_LOG entry.

## MT-AUTH — Authentication
| ID | Steps | Expected | Result |
|----|-------|----------|--------|
| MT-01 | Login with valid demo credentials | Lands on tabs (or preferences if never set) | |
| MT-02 | Login with wrong password | Friendly alert, no crash, form re-usable | |
| MT-03 | Register a brand-new email | Account created → preferences onboarding appears | |
| MT-04 | Register an existing email | 409 alert "email already exists" | |
| MT-05 | Log out from Profile | Confirmation dialog → returns to Login | |

## MT-PREF — Preferences
| ID | Steps | Expected | Result |
|----|-------|----------|--------|
| MT-06 | Fresh user first login | Interests screen shows before tabs, no back button | |
| MT-07 | Save with 1+ interests | Lands on "Where to?", never asked again on re-login | |
| MT-08 | Save button with 0 selected | Button disabled, label "Pick at least one" | |
| MT-09 | Profile → Edit interests | Current chips pre-selected; saving returns to Profile with updates | |

## MT-FLOW — Trip planning
| ID | Steps | Expected | Result |
|----|-------|----------|--------|
| MT-10 | Pick a destination | Calendar screen; past days greyed and untappable | |
| MT-11 | Tap arrival then departure day | Range highlights between; pill shows "X days" | |
| MT-12 | Tap same day twice | One-day trip accepted | |
| MT-13 | Tap a day before current start | Range restarts from the new day | |
| MT-14 | Swipe cards left/right with fast gestures | Progress bar advances exactly once per card; counter never skips | |
| MT-15 | Place closed during entire trip (Louvre, Monday-only trip) | Card shows B/W + banner; right-swipe bounces back with alert; left-swipe works | |
| MT-16 | Same place on a Mon–Tue trip | Card normal; place scheduled on Tuesday in the result | |
| MT-17 | Tap ✓/✕ buttons instead of swiping | Identical behavior to gestures | |

## MT-ITIN — Itinerary & map
| ID | Steps | Expected | Result |
|----|-------|----------|--------|
| MT-18 | Finish a multi-day deck | Stops grouped under "Day N — weekday" headers, times sequential | |
| MT-19 | View on map | Numbered markers in visit order, dashed route line, auto-zoom fits all | |
| MT-20 | Tap a marker | Callout: name, arrival time, visit duration | |
| MT-21 | Save itinerary | Button → "Saved ✓" disabled; trip appears in My trips | |
| MT-22 | Plan another without saving | Itinerary NOT in My trips | |

## MT-UX — Visual / non-functional
| ID | Steps | Expected | Result |
|----|-------|----------|--------|
| MT-23 | Press any primary button slowly | 3D press-down effect; layout doesn't jump | |
| MT-24 | Kill backend, try to login | Friendly network error, no freeze/crash | |
