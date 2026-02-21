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
  // We use a flat array for the default order, but users can shuffle them.
  // "days" is just the *template* for that week.
  days: WorkoutDay[];
};

// ----------------------------------------------------------------------
// EXERCISE DATABASE (Source: RP & Hevy Advanced PPL)
// ----------------------------------------------------------------------

const EXERCISES = {
  // Push
  bench_press: { id: 'bench_press', name: 'Bench Press', sets: 3, reps: '8-10', rest: '3 min', rpe: '8-9', notes: 'Full ROM, control eccentric.' },
  ohp_seated: { id: 'ohp_seated', name: 'Seated Overhead Press', sets: 3, reps: '8-10', rest: '3 min', rpe: '8-9', notes: 'Back supported.' },
  incline_db: { id: 'incline_db', name: 'Incline DB Press', sets: 3, reps: '10-12', rest: '2-3 min', rpe: '8', notes: '30 degree bench.' },
  lat_raise_cable: { id: 'lat_raise_cable', name: 'Cable Lateral Raise', sets: 4, reps: '12-15', rest: '90 sec', rpe: '9-10', notes: 'Focus on side delt.' },
  tricep_pushdown: { id: 'tricep_pushdown', name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', rest: '90 sec', rpe: '9', notes: 'Spread rope at bottom.' },
  overhead_tri: { id: 'overhead_tri', name: 'Overhead Tricep Ext', sets: 3, reps: '10-15', rest: '90 sec', rpe: '9', notes: 'Cable or DB.' },
  pec_deck: { id: 'pec_deck', name: 'Pec Deck / Fly', sets: 3, reps: '15-20', rest: '90 sec', rpe: '10', notes: 'Squeeze peak contraction.' },

  // Pull
  pullup: { id: 'pullup', name: 'Weighted Pullup', sets: 3, reps: '6-10', rest: '3 min', rpe: '9', notes: 'Full hang at bottom.' },
  bb_row: { id: 'bb_row', name: 'Barbell Row', sets: 3, reps: '8-10', rest: '2-3 min', rpe: '8-9', notes: 'Torso 45-60 degrees.' },
  lat_pulldown: { id: 'lat_pulldown', name: 'Lat Pulldown', sets: 3, reps: '10-15', rest: '2 min', rpe: '9', notes: 'Medium grip.' },
  cable_row: { id: 'cable_row', name: 'Seated Cable Row', sets: 3, reps: '10-15', rest: '2 min', rpe: '9', notes: 'Full stretch.' },
  face_pull: { id: 'face_pull', name: 'Face Pull', sets: 4, reps: '15-20', rest: '90 sec', rpe: '8', notes: 'External rotation focus.' },
  hammer_curl: { id: 'hammer_curl', name: 'DB Hammer Curl', sets: 3, reps: '10-12', rest: '90 sec', rpe: '9', notes: 'Elbows fixed.' },
  bicep_curl_machine: { id: 'bicep_curl_machine', name: 'Machine Preacher Curl', sets: 3, reps: '12-15', rest: '90 sec', rpe: '10', notes: 'Full stretch.' },

  // Legs
  squat: { id: 'squat', name: 'Barbell Squat', sets: 3, reps: '6-10', rest: '3-5 min', rpe: '8', notes: 'High bar, deep.' },
  rdl: { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: '8-12', rest: '3 min', rpe: '8', notes: 'Hips back, shin vertical.' },
  leg_press: { id: 'leg_press', name: 'Leg Press', sets: 3, reps: '10-15', rest: '3 min', rpe: '9', notes: 'Feet low for quad bias.' },
  leg_curl: { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, reps: '12-15', rest: '2 min', rpe: '10', notes: 'Control eccentric.' },
  leg_ext: { id: 'leg_ext', name: 'Leg Extension', sets: 3, reps: '15-20', rest: '90 sec', rpe: '10', notes: 'Pause at top.' },
  calf_raise: { id: 'calf_raise', name: 'Standing Calf Raise', sets: 4, reps: '10-15', rest: '60 sec', rpe: '9', notes: 'Pause at bottom.' },
};

// ----------------------------------------------------------------------
// WORKOUT TEMPLATES
// ----------------------------------------------------------------------

const PUSH_A_TEMPLATE: WorkoutDay = {
  id: 'push_a',
  title: 'Push A',
  focus: 'Chest & Delts',
  exercises: [EXERCISES.bench_press, EXERCISES.ohp_seated, EXERCISES.incline_db, EXERCISES.lat_raise_cable, EXERCISES.tricep_pushdown]
};

const PULL_A_TEMPLATE: WorkoutDay = {
  id: 'pull_a',
  title: 'Pull A',
  focus: 'Lats & Thickness',
  exercises: [EXERCISES.pullup, EXERCISES.bb_row, EXERCISES.lat_pulldown, EXERCISES.face_pull, EXERCISES.hammer_curl]
};

const LEGS_A_TEMPLATE: WorkoutDay = {
  id: 'legs_a',
  title: 'Legs A',
  focus: 'Squat & Quads',
  exercises: [EXERCISES.squat, EXERCISES.rdl, EXERCISES.leg_press, EXERCISES.leg_ext, EXERCISES.calf_raise]
};

const PUSH_B_TEMPLATE: WorkoutDay = {
  id: 'push_b',
  title: 'Push B',
  focus: 'Incline & Triceps',
  exercises: [EXERCISES.incline_db, EXERCISES.ohp_seated, EXERCISES.pec_deck, EXERCISES.lat_raise_cable, EXERCISES.overhead_tri]
};

const PULL_B_TEMPLATE: WorkoutDay = {
  id: 'pull_b',
  title: 'Pull B',
  focus: 'Rows & Biceps',
  exercises: [EXERCISES.bb_row, EXERCISES.lat_pulldown, EXERCISES.cable_row, EXERCISES.face_pull, EXERCISES.bicep_curl_machine]
};

const LEGS_B_TEMPLATE: WorkoutDay = {
  id: 'legs_b',
  title: 'Legs B',
  focus: 'Hams & Glutes',
  exercises: [EXERCISES.rdl, EXERCISES.leg_press, EXERCISES.leg_curl, EXERCISES.leg_ext, EXERCISES.calf_raise]
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

// Generate 8 unique weeks with globally unique IDs for every workout
export const WEEKS: Week[] = Array.from({ length: 8 }, (_, i) => {
  const weekNum = i + 1;
  const days = BASE_WEEK_DAYS.map((day, dayIndex) => ({
    ...day,
    // CRITICAL: Unique ID for every single workout instance
    // e.g., "w1_d0_push_a" (Week 1, Day 0)
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

// Global lookup for ANY workout ID (wX_dY_template)
export function getWorkoutById(workoutId: string): WorkoutDay | undefined {
  for (const week of WEEKS) {
    const found = week.days.find(d => d.id === workoutId);
    if (found) return found;
  }
  return undefined;
}
