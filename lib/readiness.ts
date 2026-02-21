export type HealthInput = {
  sleepHours?: number | null;
  restingHr?: number | null;
  hrv?: number | null;
  steps?: number | null;
};

export function calculateReadiness(input: HealthInput) {
  let score = 50;

  if (typeof input.sleepHours === 'number') {
    if (input.sleepHours >= 8) score += 20;
    else if (input.sleepHours >= 7) score += 12;
    else if (input.sleepHours >= 6) score += 5;
    else score -= 8;
  }

  if (typeof input.hrv === 'number') {
    if (input.hrv >= 70) score += 12;
    else if (input.hrv >= 55) score += 8;
    else if (input.hrv >= 45) score += 3;
    else score -= 6;
  }

  if (typeof input.restingHr === 'number') {
    if (input.restingHr <= 55) score += 10;
    else if (input.restingHr <= 62) score += 5;
    else if (input.restingHr >= 72) score -= 8;
  }

  if (typeof input.steps === 'number') {
    if (input.steps >= 7000 && input.steps <= 13000) score += 8;
    else if (input.steps > 18000) score -= 4;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const zone = score >= 75 ? 'green' : score >= 55 ? 'yellow' : 'red';

  const recommendation =
    zone === 'green'
      ? 'Push top sets. Go for overload targets.'
      : zone === 'yellow'
      ? 'Keep load stable. Cap top sets at RPE 8-9.'
      : 'Recovery pivot. Drop 5-10% load and cut 1-2 sets.';

  return { score, zone, recommendation };
}
