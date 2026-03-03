import { MuscleGroup } from '@/app/components/MuscleAnatomyView';

export interface ExerciseDemoMedia {
  src: string;
  poster: string;
  attribution: string;
}

export interface ExerciseInfo {
  demo: ExerciseDemoMedia;
  muscles: {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
  };
  tips: string[];
}

function withDemo(
  id: string,
  muscles: { primary: MuscleGroup[]; secondary: MuscleGroup[] },
  tips: string[]
): ExerciseInfo {
  return {
    demo: {
      src: `/exercise-demos/${id}.mp4`,
      poster: `/exercise-demos/${id}.jpg`,
      attribution: 'RockyFit Exercise Demo Library',
    },
    muscles,
    tips,
  };
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  bench_press: withDemo('bench_press', {
    primary: ['chest', 'triceps', 'front_delts'],
    secondary: ['side_delts'],
  }, [
    'Retract and depress your shoulder blades — "bend the bar" cue',
    'Drive your feet into the floor throughout the lift',
    'Lower the bar to mid-chest, not your neck',
    'Maintain a slight arch in your lower back',
    'Flare elbows ~45° from torso, not 90°',
  ]),
  deadlift: withDemo('deadlift', {
    primary: ['lower_back', 'glutes', 'hamstrings'],
    secondary: ['traps', 'lats', 'quads', 'forearms'],
  }, [
    'Hinge at the hips, not the knees — think "push the floor away"',
    'Keep the barbell close to your body throughout the lift',
    'Engage your lats by "protecting your armpits"',
    'Drive through your heels, not your toes',
    'Lock out by squeezing your glutes, not hyperextending your back',
  ]),
  squat: withDemo('squat', {
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'lower_back', 'calves'],
  }, [
    'Brace your core like you\'re about to get punched',
    'Push your knees out in line with your toes',
    'Keep your chest up — don\'t lean forward excessively',
    'Break at the hips and knees simultaneously',
    'Hit depth: hip crease below knee top',
  ]),
  hack_squat: withDemo('hack_squat', {
    primary: ['quads'],
    secondary: ['glutes', 'calves'],
  }, [
    'Position feet shoulder-width or slightly wider',
    'Keep your back flat against the pad',
    'Drive through your whole foot, not just heels',
    'Don\'t lock out knees at the top — keep tension',
    'Control the descent — don\'t just drop',
  ]),
  meadows_row: withDemo('meadows_row', {
    primary: ['lats'],
    secondary: ['rear_delts', 'biceps', 'forearms'],
  }, [
    'Lean into the weight for a full stretch',
    'Keep your back flat, slight hip hinge',
    'Pull to your hip, not your chest',
    'Squeeze the lat at the top of each rep',
    'Use a neutral grip (handle perpendicular to body)',
  ]),
  larson_press: withDemo('larson_press', {
    primary: ['chest', 'triceps'],
    secondary: ['front_delts'],
  }, [
    'Lower the handles to your chest with control',
    'Keep your elbows at a 45° angle to your body',
    'Drive through your palms, not your fingers',
    'Don\'t flare elbows out to 90°',
    'Maintain constant tension — don\'t bounce at bottom',
  ]),
  incline_smith: withDemo('incline_smith', {
    primary: ['chest', 'front_delts'],
    secondary: ['triceps'],
  }, [
    'Set bench to 30-45° incline',
    'Lower the bar to upper chest, not neck or stomach',
    'Keep your shoulder blades retracted throughout',
    'Drive your feet into the floor for stability',
    'Control the bar path — don\'t let it drift',
  ]),
  egyptian_raise: withDemo('egyptian_raise', {
    primary: ['side_delts'],
    secondary: ['rear_delts', 'traps'],
  }, [
    'Lean slightly forward from the hips',
    'Raise arms out to sides in a "Y" pattern',
    'Lead with your elbows, not your hands',
    'Squeeze shoulder blades at the top',
    'Use controlled tempo — no swinging',
  ]),
  skull_crusher: withDemo('skull_crusher', {
    primary: ['triceps'],
    secondary: ['front_delts'],
  }, [
    'Keep elbows pointed at the ceiling, not out to sides',
    'Lower the weight to your forehead, not behind your head',
    'Keep upper arms stationary — only forearms move',
    'Don\'t lock out completely at the bottom',
    'Squeeze triceps at the top',
  ]),
  jm_press: withDemo('jm_press', {
    primary: ['triceps', 'chest'],
    secondary: ['front_delts'],
  }, [
    'Think "pressing" not "crushing" — horizontal bar path',
    'Lower bar to chest with elbows tucked',
    'At the bottom, allow slight elbow flare to clear chest',
    'Drive up in a slight arc, not straight up',
    'Focus on chest and tricep contraction',
  ]),
  dips: withDemo('dips', {
    primary: ['chest', 'triceps'],
    secondary: ['front_delts', 'side_delts'],
  }, [
    'Lean forward slightly to target chest more',
    'Stay upright to target triceps more',
    'Lower until upper arms are parallel to floor',
    'Don\'t shrug shoulders at the bottom',
    'Drive up through your palms',
  ]),
  pullup_neutral: withDemo('pullup_neutral', {
    primary: ['lats', 'biceps'],
    secondary: ['rear_delts', 'lower_back'],
  }, [
    'Engage your lats before pulling — "pack the shoulders"',
    'Pull your chin over the bar, not chest',
    'Avoid kipping or swinging',
    'Control the descent — don\'t just drop',
    'Squeeze at the top for 1 second',
  ]),
  straight_arm: withDemo('straight_arm', {
    primary: ['lats'],
    secondary: ['abs', 'triceps'],
  }, [
    'Keep arms straight throughout — no bending',
    'Pull from the elbows, not the hands',
    'Keep shoulders down and lats engaged',
    'Control the stretch at the bottom',
    'Squeeze lats at the top',
  ]),
  rear_delt_fly: withDemo('rear_delt_fly', {
    primary: ['rear_delts'],
    secondary: ['traps', 'upper_back'],
  }, [
    'Bend over until torso is nearly parallel to floor',
    'Keep a slight bend in your elbows throughout',
    'Squeeze shoulder blades together at the top',
    'Don\'t use momentum — controlled movements',
    'Lead with your elbows, not hands',
  ]),
  bayesian_curl: withDemo('bayesian_curl', {
    primary: ['biceps'],
    secondary: ['front_delts'],
  }, [
    'Keep elbows at your sides throughout',
    'Curl the weight up, not out',
    'Squeeze biceps at the top',
    'Control the negative — don\'t just drop',
    'Don\'t swing your body to lift the weight',
  ]),
  waiter_curl: withDemo('waiter_curl', {
    primary: ['biceps'],
    secondary: ['forearms'],
  }, [
    'Hold the dumbbell vertically by the handle end',
    'Keep your elbow pinned to your side',
    'Curl up with a supinating motion',
    'Squeeze at the top',
    'Control the descent',
  ]),
  bulgarian: withDemo('bulgarian', {
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'calves'],
  }, [
    'Position back foot on bench or step',
    'Keep front knee tracking over toes',
    'Lower until front thigh is parallel to floor',
    'Keep torso upright, core braced',
    'Drive through front heel to stand',
  ]),
  sldl: withDemo('sldl', {
    primary: ['hamstrings', 'glutes'],
    secondary: ['lower_back', 'calves'],
  }, [
    'Hinge at hips, slight knee bend',
    'Keep back flat, chest up',
    'Lower until you feel a stretch in hamstrings',
    'Drive hips forward to stand',
    'Squeeze glutes at the top',
  ]),
  seated_ham: withDemo('seated_ham', {
    primary: ['hamstrings'],
    secondary: ['lower_back', 'glutes'],
  }, [
    'Sit on edge of bench with legs extended',
    'Hinge forward at hips, not round your back',
    'Lower torso toward floor',
    'Keep legs straight or slightly bent',
    'Feel stretch in hamstrings, not lower back',
  ]),
  donkey_calf: withDemo('donkey_calf', {
    primary: ['calves'],
    secondary: ['lower_back'],
  }, [
    'Bend at hips, keeping back flat',
    'Position feet hip-width apart',
    'Lower heels below the platform for full stretch',
    'Drive up onto balls of feet',
    'Squeeze calves at the top',
  ]),
};
