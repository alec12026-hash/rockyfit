# RockyFit Changelog

All notable changes to RockyFit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-03-02

### Added
- **Manual Daily Check-In** — Users can now log sleep, energy, soreness, and mood directly in the app. No Apple Watch required to get a readiness score.
- **Per-User Coaching Emails** — Coaching reports now send at each user's configured time. Includes workout-aware logic.
- **Nudge Emails for New Users** — Users who haven't logged a workout yet receive a personalized motivation email asking about their goals.
- **Password Reset** — Full self-service password reset flow via email.
- **Profile/Settings Persistence** — User settings now properly save to the database for all users.
- **Check-In Nudge on Home** — Home screen shows a subtle prompt to log a check-in when no health data exists.
- **Research-Backed Program Regeneration** — Program changes triggered by user emails now run through the full research + AI generation pipeline with fresh scientific context.

### Fixed
- **Privacy Bug** — Readiness data now properly scoped to each user (no cross-user data leakage).
- **Login Redirect** — Fixed redirect loop on login by using hard page reload.
- **Password Hash** — Fixed corrupted password hash preventing login for test accounts.
- **Multi-User Settings** — Fixed user_settings table to properly support multiple users with unique constraints.
- **Public Page Access** — Password reset pages now accessible without authentication.

### Changed
- **Training Day Spreading** — Low-frequency programs (2-3 days/week) now spread across the week rather than clustered (e.g., 2 days = Mon/Thu, 3 days = Mon/Wed/Fri).
- **Auth Default Removed** — Unauthenticated visitors are now redirected to login instead of defaulting to Alec's account.

---

## [1.0.0] - 2026-03-01

### Added
- Initial RockyFit beta release
- Apple Health integration for readiness scoring
- AI-powered workout program generation
- Email coaching (inbound/outbound)
- Basic onboarding flow
- Home, workout, health, progress, and settings pages
