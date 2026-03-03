export interface ExerciseInfo {
  gifUrl: string;
  tips: string[];
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  bench_press: {
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    tips: [
      'Retract and depress your shoulder blades — "bend the bar" cue',
      'Drive your feet into the floor throughout the lift',
      'Lower the bar to mid-chest, not your neck',
      'Maintain a slight arch in your lower back',
      'Flare elbows ~45° from torso, not 90°',
    ],
  },
  deadlift: {
    gifUrl: 'https://media.giphy.com/media/1qfDU4MJv9xoGLqrjC/giphy.gif',
    tips: [
      'Hinge at the hips, not the knees — think "push the floor away"',
      'Keep the barbell close to your body throughout the lift',
      'Engage your lats by "protecting your armpits"',
      'Drive through your heels, not your toes',
      'Lock out by squeezing your glutes, not hyperextending your back',
    ],
  },
  squat: {
    gifUrl: 'https://media.giphy.com/media/1qfKN8Dt0CRdCRxz9q/giphy.gif',
    tips: [
      'Brace your core like you\'re about to get punched',
      'Push your knees out in line with your toes',
      'Keep your chest up — don\'t lean forward excessively',
      'Break at the hips and knees simultaneously',
      'Hit depth: hip crease below knee top',
    ],
  },
  hack_squat: {
    gifUrl: 'https://media.giphy.com/media/xT8qBvgKeMvMGSWCHU/giphy.gif',
    tips: [
      'Position feet shoulder-width or slightly wider',
      'Keep your back flat against the pad',
      'Drive through your whole foot, not just heels',
      'Don\'t lock out knees at the top — keep tension',
      'Control the descent — don\'t just drop',
    ],
  },
  meadows_row: {
    gifUrl: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    tips: [
      'Lean into the weight for a full stretch',
      'Keep your back flat, slight hip hinge',
      'Pull to your hip, not your chest',
      'Squeeze the lat at the top of each rep',
      'Use a neutral grip (handle perpendicular to body)',
    ],
  },
  larson_press: {
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    tips: [
      'Lower the handles to your chest with control',
      'Keep your elbows at a 45° angle to your body',
      'Drive through your palms, not your fingers',
      'Don\'t flare elbows out to 90°',
      'Maintain constant tension — don\'t bounce at bottom',
    ],
  },
  incline_smith: {
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    tips: [
      'Set bench to 30-45° incline',
      'Lower the bar to upper chest, not neck or stomach',
      'Keep your shoulder blades retracted throughout',
      'Drive your feet into the floor for stability',
      'Control the bar path — don\'t let it drift',
    ],
  },
  egyptian_raise: {
    gifUrl: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    tips: [
      'Lean slightly forward from the hips',
      'Raise arms out to sides in a "Y" pattern',
      'Lead with your elbows, not your hands',
      'Squeeze shoulder blades at the top',
      'Use controlled tempo — no swinging',
    ],
  },
  skull_crusher: {
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    tips: [
      'Keep elbows pointed at the ceiling, not out to sides',
      'Lower the weight to your forehead, not behind your head',
      'Keep upper arms stationary — only forearms move',
      'Don\'t lock out completely at the bottom',
      'Squeeze triceps at the top',
    ],
  },
  jm_press: {
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    tips: [
      'Think "pressing" not "crushing" — horizontal bar path',
      'Lower bar to chest with elbows tucked',
      'At the bottom, allow slight elbow flare to clear chest',
      'Drive up in a slight arc, not straight up',
      'Focus on chest and tricep contraction',
    ],
  },
  dips: {
    gifUrl: 'https://media.giphy.com/media/xT8qBvgKeMvMGSWCHU/giphy.gif',
    tips: [
      'Lean forward slightly to target chest more',
      'Stay upright to target triceps more',
      'Lower until upper arms are parallel to floor',
      'Don\'t shrug shoulders at the bottom',
      'Drive up through your palms',
    ],
  },
  pullup_neutral: {
    gifUrl: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    tips: [
      'Engage your lats before pulling — "pack the shoulders"',
      'Pull your chin over the bar, not chest',
      'Avoid kipping or swinging',
      'Control the descent — don\'t just drop',
      'Squeeze at the top for 1 second',
    ],
  },
  straight_arm: {
    gifUrl: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    tips: [
      'Keep arms straight throughout — no bending',
      'Pull from the elbows, not the hands',
      'Keep shoulders down and lats engaged',
      'Control the stretch at the bottom',
      'Squeeze lats at the top',
    ],
  },
  rear_delt_fly: {
    gifUrl: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    tips: [
      'Bend over until torso is nearly parallel to floor',
      'Keep a slight bend in your elbows throughout',
      'Squeeze shoulder blades together at the top',
      'Don\'t use momentum — controlled movements',
      'Lead with your elbows, not hands',
    ],
  },
  bayesian_curl: {
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    tips: [
      'Keep elbows at your sides throughout',
      'Curl the weight up, not out',
      'Squeeze biceps at the top',
      'Control the negative — don\'t just drop',
      'Don\'t swing your body to lift the weight',
    ],
  },
  waiter_curl: {
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    tips: [
      'Hold the dumbbell vertically by the handle end',
      'Keep your elbow pinned to your side',
      'Curl up with a supinating motion',
      'Squeeze at the top',
      'Control the descent',
    ],
  },
  bulgarian: {
    gifUrl: 'https://media.giphy.com/media/1qfKN8Dt0CRdCRxz9q/giphy.gif',
    tips: [
      'Position back foot on bench or step',
      'Keep front knee tracking over toes',
      'Lower until front thigh is parallel to floor',
      'Keep torso upright, core braced',
      'Drive through front heel to stand',
    ],
  },
  sldl: {
    gifUrl: 'https://media.giphy.com/media/1qfDU4MJv9xoGLqrjC/giphy.gif',
    tips: [
      'Hinge at hips, slight knee bend',
      'Keep back flat, chest up',
      'Lower until you feel a stretch in hamstrings',
      'Drive hips forward to stand',
      'Squeeze glutes at the top',
    ],
  },
  seated_ham: {
    gifUrl: 'https://media.giphy.com/media/1qfDU4MJv9xoGLqrjC/giphy.gif',
    tips: [
      'Sit on edge of bench with legs extended',
      'Hinge forward at hips, not round your back',
      'Lower torso toward floor',
      'Keep legs straight or slightly bent',
      'Feel stretch in hamstrings, not lower back',
    ],
  },
  donkey_calf: {
    gifUrl: 'https://media.giphy.com/media/xT8qBvgKeMvMGSWCHU/giphy.gif',
    tips: [
      'Bend at hips, keeping back flat',
      'Position feet hip-width apart',
      'Lower heels below the platform for full stretch',
      'Drive up onto balls of feet',
      'Squeeze calves at the top',
    ],
  },
};
