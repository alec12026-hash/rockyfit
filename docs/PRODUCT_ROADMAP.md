# RockyFit Product + Technical Roadmap

## Phase 1 — Stabilize the Core
- Remove Alec/user_id=1 special-case program behavior.
- Make generated per-user programs the primary source of truth.
- Fix workout schema mismatches and user ownership on all workout tables.
- Tighten auth so normal app traffic relies on cookie/session, not raw user-id headers.
- Store coaching reports in a `coaching_reports` table for audit/debug/history.

## Phase 2 — Make Multi-User Real
- Normalize program storage:
  - `programs`
  - `program_weeks`
  - `program_days`
  - `program_day_exercises`
- Every row tied to `user_id`.
- Add program regeneration/versioning so old workout history still points to the program version used at the time.
- Add substitutions table and equipment/injury constraints per user.

## Phase 3 — Coaching Loop
- Use logged session data + recent trends + readiness to generate session-specific coaching reports.
- Use Minimax for default daily reports.
- Fall back to deterministic rules if model call fails.
- Archive reports and expose in-app coaching history.
- Add weekly recap emails.

## Phase 4 — Product Depth
- Today screen with one obvious CTA.
- Adaptive progression suggestions.
- Substitution engine.
- Streak/adherence dashboard.
- Recovery flags and deload recommendations.
