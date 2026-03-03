import type { Week, WorkoutDay, Exercise } from '@/lib/program';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

// Evidence-informed spacing templates to balance stimulus frequency and recovery.
// Goal: avoid clustering all sessions at the start of the week for lower frequencies.
const TRAINING_DAY_TEMPLATES: Record<number, number[]> = {
  1: [2], // Wed
  2: [0, 3], // Mon, Thu
  3: [0, 2, 4], // Mon, Wed, Fri
  4: [0, 1, 3, 5], // Mon, Tue, Thu, Sat
  5: [0, 1, 2, 4, 5], // Mon, Tue, Wed, Fri, Sat
  6: [0, 1, 2, 3, 4, 5], // Mon-Sat
  7: [0, 1, 2, 3, 4, 5, 6] // Daily
};

export function getTrainingDayIndices(daysPerWeekRaw: number): number[] {
  const daysPerWeek = Math.max(1, Math.min(7, Number(daysPerWeekRaw) || 3));
  return TRAINING_DAY_TEMPLATES[daysPerWeek] || TRAINING_DAY_TEMPLATES[3];
}

export function getTrainingDayKeys(daysPerWeekRaw: number): string[] {
  return getTrainingDayIndices(daysPerWeekRaw).map((idx) => WEEKDAY_KEYS[idx]);
}

export function buildWeeksFromProgram(programData: any, maxWeeks?: number): Week[] {
  const weeksCount = Math.max(1, Number(programData?.weeks) || 4);
  const daysPerWeek = Math.max(1, Math.min(7, Number(programData?.daysPerWeek) || 3));
  const days = Array.isArray(programData?.days) ? programData.days : [];

  if (days.length === 0) return [];

  const trainingIndices = getTrainingDayIndices(daysPerWeek);
  const finalWeekCount = typeof maxWeeks === 'number' ? Math.max(1, Math.min(weeksCount, maxWeeks)) : weeksCount;

  const weeks: Week[] = [];

  for (let w = 0; w < finalWeekCount; w++) {
    const weekDays: WorkoutDay[] = [];
    let trainingCursor = 0;

    for (let d = 0; d < 7; d++) {
      const isTrainingDay = trainingIndices.includes(d);

      if (isTrainingDay) {
        const dayData = days[trainingCursor % days.length] || days[0];
        const exercises: Exercise[] = (dayData?.exercises || []).map((ex: any, idx: number) => ({
          id: `w${w + 1}_d${d}_${String(ex.name || 'exercise').toLowerCase().replace(/\s+/g, '_')}_${idx}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          rpe: ex.rpe,
          notes: ex.rationale
        }));

        weekDays.push({
          id: `w${w + 1}_d${d}`,
          title: dayData?.name || `Day ${trainingCursor + 1}`,
          focus: (dayData?.muscleGroups || []).join(', '),
          exercises
        });

        trainingCursor += 1;
      } else {
        weekDays.push({
          id: `w${w + 1}_d${d}_rest`,
          title: 'Rest',
          focus: 'Recovery',
          exercises: []
        });
      }
    }

    weeks.push({
      id: `week_${w + 1}`,
      number: w + 1,
      days: weekDays
    });
  }

  return weeks;
}
