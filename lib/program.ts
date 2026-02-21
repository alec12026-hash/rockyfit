// ----------------------------------------------------------------------
// DATA TYPES
// ----------------------------------------------------------------------

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  rpe?: string;
  notes?: string;
};

export type WorkoutDay = {
  id: string;
  title: string;
  focus: string;
  exercises: Exercise[];
};

export type Week = {
  id: string;
  number: number;
  days: WorkoutDay[];
};

// ----------------------------------------------------------------------
// EXERCISE DATABASE - "SHOCK PHASE" (High Intensity / Novel Angles)
// ----------------------------------------------------------------------

const EXERCISES = {
  // Push (Core: Bench)
  bench_press: { id: 'bench_press', name: 'Barbell Bench Press', sets: 3, reps: '6-8', rest: '3-4 min', rpe: '9', notes: 'Heavy core lift. Pause 1s at chest.' },
  larson_press: { id: 'larson_press', name: 'Larson Press', sets: 3, reps: '8-10', rest: '3 min', rpe: '9', notes: 'Feet in air. Stability focus.' },
  incline_smith: { id: 'incline_smith', name: 'Smith Incline Press', sets: 3, reps: '10-12', rest: '2 min', rpe: '10', notes: 'Slow eccentric (3s). High angle.' },
  egyptian_raise: { id: 'egyptian_raise', name: 'Egyptian Lateral Raise', sets: 4, reps: '12-15', rest: '60 sec', rpe: '10', notes: 'Leaning away cable raise. Constant tension.' },
  skull_crusher: { id: 'skull_crusher', name: 'EZ Bar Skullcrusher', sets: 3, reps: '10-12', rest: '90 sec', rpe: '9', notes: 'Bring bar behind head for long head stretch.' },
  jm_press: { id: 'jm_press', name: 'JM Press', sets: 3, reps: '8-10', rest: '2 min', rpe: '9', notes: 'Hybrid press/extension. Great for lockout.' },
  dips: { id: 'dips', name: 'Weighted Dips', sets: 3, reps: 'AMRAP', rest: '2 min', rpe: '10', notes: 'Lean forward for chest.' },

  // Pull (Core: Deadlift)
  deadlift: { id: 'deadlift', name: 'Deadlift', sets: 3, reps: '3-5', rest: '4-5 min', rpe: '8.5', notes: 'Reset every rep. Violent concentric.' },
  meadows_row: { id: 'meadows_row', name: 'Meadows Row', sets: 3, reps: '10-12', rest: '2 min', rpe: '9', notes: 'Landmine/DB. Elbow out wide.' },
  pullup_neutral: { id: 'pullup_neutral', name: 'Neutral Grip Pullup', sets: 3, reps: '8-10', rest: '2-3 min', rpe: '9', notes: 'Focus on lats, not biceps.' },
  straight_arm: { id: 'straight_arm', name: 'Cable Straight Arm Pushdown', sets: 3, reps: '12-15', rest: '60 sec', rpe: '10', notes: 'Lat isolation finisher.' },
  rear_delt_fly: { id: 'rear_delt_fly', name: 'Reverse Pec Deck', sets: 4, reps: '15-20', rest: '60 sec', rpe: '9', notes: 'Pinkies out.' },
  bayesian_curl: { id: 'bayesian_curl', name: 'Bayesian Cable Curl', sets: 3, reps: '12-15', rest: '90 sec', rpe: '10', notes: 'Cable behind back. Maximal stretch.' },
  waiter_curl: { id: 'waiter_curl', name: 'DB Waiter Curl', sets: 3, reps: '10-12', rest: '60 sec', rpe: '9', notes: 'Cupping top of DB. Peak contraction.' },

  // Legs (Core: Squat)
  squat: { id: 'squat', name: 'Barbell Squat', sets: 3, reps: '5-8', rest: '4-5 min', rpe: '8.5', notes: 'Comp standard depth.' },
  hack_squat: { id: 'hack_squat', name: 'Hack Squat', sets: 3, reps: '10-12', rest: '3 min', rpe: '10', notes: 'Feet low/close. Quad sweep focus.' },
  bulgarian: { id: 'bulgarian', name: 'Bulgarian Split Squat', sets: 3, reps: '8-10', rest: '2 min', rpe: '9', notes: 'Death. Dumbbells in hand.' },
  sldl: { id: 'sldl', name: 'Stiff Leg Deadlift', sets: 3, reps: '8-10', rest: '3 min', rpe: '8', notes: 'Deficit if flexible. Hamstring bias.' },
  seated_ham: { id: 'seated_ham', name: 'Seated Leg Curl', sets: 3, reps: '12-15', rest: '90 sec', rpe: '10', notes: 'Lean forward slightly.' },
  donkey_calf: { id: 'donkey_calf', name: 'Donkey/Leg Press Calf', sets: 4, reps: '15-20', rest: '60 sec', rpe: '9', notes: 'Deep stretch.' },
};

// ----------------------------------------------------------------------
// WORKOUT TEMPLATES - PHASE 2 (SHOCK)
// ----------------------------------------------------------------------

const PUSH_A_TEMPLATE: WorkoutDay = {
  id: 'push_a',
  title: 'Push A (Heavy)',
  focus: 'Chest Power & Triceps',
  exercises: [EXERCISES.bench_press, EXERCISES.incline_smith, EXERCISES.jm_press, EXERCISES.egyptian_raise, EXERCISES.dips]
};

const PULL_A_TEMPLATE: WorkoutDay = {
  id: 'pull_a',
  title: 'Pull A (Heavy)',
  focus: 'Deadlift & Width',
  exercises: [EXERCISES.deadlift, EXERCISES.pullup_neutral, EXERCISES.meadows_row, EXERCISES.rear_delt_fly, EXERCISES.bayesian_curl]
};

const LEGS_A_TEMPLATE: WorkoutDay = {
  id: 'legs_a',
  title: 'Legs A (Squat)',
  focus: 'Squat & Quads',
  exercises: [EXERCISES.squat, EXERCISES.hack_squat, EXERCISES.seated_ham, EXERCISES.donkey_calf]
};

const PUSH_B_TEMPLATE: WorkoutDay = {
  id: 'push_b',
  title: 'Push B (Volume)',
  focus: 'Upper Chest & Shoulders',
  exercises: [EXERCISES.larson_press, EXERCISES.incline_smith, EXERCISES.dips, EXERCISES.egyptian_raise, EXERCISES.skull_crusher]
};

const PULL_B_TEMPLATE: WorkoutDay = {
  id: 'pull_b',
  title: 'Pull B (Volume)',
  focus: 'Lats & Biceps',
  exercises: [EXERCISES.meadows_row, EXERCISES.straight_arm, EXERCISES.pullup_neutral, EXERCISES.rear_delt_fly, EXERCISES.waiter_curl]
};

const LEGS_B_TEMPLATE: WorkoutDay = {
  id: 'legs_b',
  title: 'Legs B (Hams)',
  focus: 'Unilateral & Chain',
  exercises: [EXERCISES.sldl, EXERCISES.bulgarian, EXERCISES.seated_ham, EXERCISES.hack_squat, EXERCISES.donkey_calf]
};

// ----------------------------------------------------------------------
// WEEK GENERATOR
// ----------------------------------------------------------------------

const BASE_WEEK_DAYS = [
  { ...PUSH_A_TEMPLATE }, // Mon
  { ...PULL_A_TEMPLATE }, // Tue
  { ...LEGS_A_TEMPLATE }, // Wed
  { ...PUSH_B_TEMPLATE }, // Thu
  { ...PULL_B_TEMPLATE }, // Fri
  { ...LEGS_B_TEMPLATE }, // Sat
  { id: 'rest', title: 'Rest', focus: 'Recovery', exercises: [] } // Sun
];

// Generate 8 unique weeks with globally unique IDs
export const WEEKS: Week[] = Array.from({ length: 8 }, (_, i) => {
  const weekNum = i + 1;
  const days = BASE_WEEK_DAYS.map((day, dayIndex) => ({
    ...day,
    // Unique ID: w1_d0_push_a
    id: `w${weekNum}_d${dayIndex}_${day.id}`
  }));

  return {
    id: `week_${weekNum}`,
    number: weekNum,
    days: days
  };
});

// ----------------------------------------------------------------------
// LOOKUP HELPERS
// ----------------------------------------------------------------------

export function getWeek(weekNum: number) {
  return WEEKS.find(w => w.number === weekNum);
}

// Global lookup for ANY workout ID
export function getWorkoutById(workoutId: string): WorkoutDay | undefined {
  for (const week of WEEKS) {
    const found = week.days.find(d => d.id === workoutId);
    if (found) return found;
  }
  return undefined;
}
