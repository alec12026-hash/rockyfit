export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
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
  days: Record<string, WorkoutDay>;
};

// Base templates for A/B split
const PUSH_A: WorkoutDay = {
  id: 'push_a',
  title: 'Push A',
  focus: 'Chest & Front Delts',
  exercises: [
    { id: 'bench_press', name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest: '3 min', notes: 'Heavy compound. Focus on control.' },
    { id: 'ohp', name: 'Overhead Press', sets: 3, reps: '8-10', rest: '2-3 min', notes: 'Standing. Brace core.' },
    { id: 'inc_db_press', name: 'Incline DB Press', sets: 3, reps: '10-12', rest: '2 min', notes: '30 degree incline.' },
    { id: 'lat_raise', name: 'Cable Lateral Raise', sets: 4, reps: '15-20', rest: '90 sec', notes: 'Control the eccentric.' },
    { id: 'tri_pushdown', name: 'Tricep Pushdown', sets: 3, reps: '12-15', rest: '90 sec', notes: 'Rope attachment.' }
  ]
};

const PULL_A: WorkoutDay = {
  id: 'pull_a',
  title: 'Pull A',
  focus: 'Back Thickness & Biceps',
  exercises: [
    { id: 'deadlift', name: 'Deadlift', sets: 3, reps: '5', rest: '3-5 min', notes: 'Conventional or Sumo.' },
    { id: 'pullup', name: 'Weighted Pullups', sets: 3, reps: '6-8', rest: '3 min', notes: 'Full ROM.' },
    { id: 'chest_supp_row', name: 'Chest Supported Row', sets: 3, reps: '10-12', rest: '2 min', notes: 'Squeeze at top.' },
    { id: 'face_pull', name: 'Face Pulls', sets: 4, reps: '15-20', rest: '90 sec', notes: 'Focus on rear delts.' },
    { id: 'hammer_curl', name: 'Hammer Curls', sets: 3, reps: '10-12', rest: '90 sec', notes: 'DB or Cable.' }
  ]
};

const LEGS_A: WorkoutDay = {
  id: 'legs_a',
  title: 'Legs A',
  focus: 'Squat & Quads',
  exercises: [
    { id: 'squat', name: 'Back Squat', sets: 4, reps: '6-8', rest: '3-5 min', notes: 'High bar preferably.' },
    { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: '8-10', rest: '3 min', notes: 'Feel the stretch.' },
    { id: 'leg_press', name: 'Leg Press', sets: 3, reps: '12-15', rest: '2 min', notes: 'Feet low for quad focus.' },
    { id: 'leg_ext', name: 'Leg Extension', sets: 3, reps: '15-20', rest: '90 sec', notes: 'Drop set on last set.' },
    { id: 'calf_raise', name: 'Standing Calf Raise', sets: 4, reps: '15-20', rest: '60 sec', notes: 'Slow tempo.' }
  ]
};

// Generate 8 weeks of data
export const WEEKS: Week[] = Array.from({ length: 8 }, (_, i) => ({
  id: \`week_\${i + 1}\`,
  number: i + 1,
  days: {
    'monday': { ...PUSH_A, id: 'push_a' },
    'tuesday': { ...PULL_A, id: 'pull_a' },
    'wednesday': { ...LEGS_A, id: 'legs_a' },
    'thursday': { ...PUSH_A, id: 'push_a_2' }, // In real app, make Push B
    'friday': { ...PULL_A, id: 'pull_a_2' },   // In real app, make Pull B
    'saturday': { ...LEGS_A, id: 'legs_a_2' }, // In real app, make Legs B
    'sunday': { id: 'rest', title: 'Rest Day', focus: 'Recovery', exercises: [] }
  }
}));

export function getWeek(weekNum: number) {
  return WEEKS.find(w => w.number === weekNum);
}
