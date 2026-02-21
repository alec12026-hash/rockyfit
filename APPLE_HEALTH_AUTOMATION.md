# Apple Health Auto-Upload Setup (Daily)

This gives RockyFit automated morning readiness + post-workout sync.

## 1) Configure RockyFit secrets (Vercel)

In Vercel Project → Settings → Environment Variables:

- `HEALTH_INGEST_TOKEN` = long random token
- `POSTGRES_URL` / `POSTGRES_PRISMA_URL` (if not already set)

Redeploy after setting env vars.

## 2) Run DB setup once

```bash
npm run db:setup
```

Creates:
- `health_daily`
- `health_workouts`
- `workout_logs`

## 3) iPhone Shortcut: Morning Upload (6:30 AM)

Create shortcut: **RockyFit Morning Health Upload**

Actions:
1. `Find Health Samples` → Type: Body Mass → Sort latest → limit 1
2. `Find Health Samples` → Type: Sleep Analysis (last night)
3. `Find Health Samples` → Type: Resting Heart Rate (today/latest)
4. `Find Health Samples` → Type: Heart Rate Variability (SDNN, latest)
5. `Find Health Samples` → Type: Steps (today)
6. Compute totals in shortcut variables
7. `Text` action with JSON:

```json
{
  "sourceDate": "<today yyyy-mm-dd>",
  "weightKg": <weight_kg>,
  "sleepHours": <sleep_hours>,
  "restingHr": <resting_hr>,
  "hrv": <hrv>,
  "steps": <steps>
}
```

8. `Get Contents of URL`
   - URL: `https://rockyfit.vercel.app/api/health/ingest`
   - Method: `POST`
   - Headers:
     - `Authorization: Bearer YOUR_HEALTH_INGEST_TOKEN`
     - `Content-Type: application/json`
   - Request Body: JSON from step 7

Then create Personal Automation:
- Trigger: Time of Day (6:30 AM)
- Run shortcut automatically.

## 4) iPhone Shortcut: Post-Workout Upload (after workout ends)

Create shortcut: **RockyFit Post Workout Upload**

Actions:
1. `Find Health Samples` → Type: Workout (today, latest)
2. Extract:
   - workout type
   - duration (min)
   - avg heart rate
   - max heart rate
   - active energy (kcal)
3. Build JSON:

```json
{
  "sourceDate": "<today yyyy-mm-dd>",
  "workout": {
    "workoutType": "<type>",
    "durationMin": <duration_min>,
    "avgHr": <avg_hr>,
    "maxHr": <max_hr>,
    "activeKcal": <active_kcal>
  }
}
```

4. POST to same endpoint with same headers.

Automation trigger options:
- Time-based (e.g. 7:30 PM daily), or
- Focus mode / app close workflow after gym.

## 5) Night coaching summary

Endpoint:
- `GET https://rockyfit.vercel.app/api/coach/nightly`

Returns a short coaching summary using readiness zone.

---

## Optional hardening
- Use separate token for morning vs post-workout uploads.
- Add IP allowlist in edge middleware.
- Add signature header (HMAC) if you want stricter auth.
