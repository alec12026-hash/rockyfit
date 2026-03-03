import { NextResponse } from 'next/server';

const cache = new Map<string, any>();

// Curated overrides to prevent bad auto-matches
const CURATED_OVERRIDES: Array<{ match: RegExp; exerciseId: string; matchName: string; tips: string[] }> = [
  {
    match: /\b(back\s+squat|barbell\s+back\s+squat|barbell\s+squat|squat)\b/i,
    exerciseId: 'qXTaZnJ',
    matchName: 'barbell full squat',
    tips: [
      'Brace your core tight before unracking the bar',
      'Push your knees out in line with your toes throughout the movement',
      'Keep your chest up — avoid excessive forward lean',
      'Hit depth: hip crease should reach or pass knee level',
      'Drive through your whole foot, not just heels',
    ],
  },
  {
    match: /\bbench\s+press\b/i,
    exerciseId: 'EIeI8Vf',
    matchName: 'barbell bench press',
    tips: [
      'Retract your shoulder blades — think "bend the bar"',
      'Lower the bar to mid-chest, not neck or stomach',
      'Elbows at roughly 45° from torso, not flared to 90°',
      'Drive your feet into the floor throughout',
      'Maintain a slight arch in your lower back',
    ],
  },
  {
    match: /\bdips?\b/i,
    exerciseId: 'bZq4bwK',
    matchName: 'weighted tricep dips',
    tips: [
      'Lean forward slightly to target chest more',
      'Stay upright to shift emphasis to triceps',
      'Lower until upper arms are parallel to floor',
      'Don\'t shrug your shoulders at the bottom',
      'Drive up through your palms',
    ],
  },
  {
    match: /\bhack\s+squat\b/i,
    exerciseId: 'Qa55kX1',
    matchName: 'sled hack squat',
    tips: [
      'Feet shoulder-width or slightly wider on the platform',
      'Keep your back flat against the pad throughout',
      'Drive through your whole foot — not just heels',
      'Don\'t lock out knees fully at the top',
      'Control the descent — don\'t drop',
    ],
  },
  {
    match: /\bromanian\s+deadlift\b/i,
    exerciseId: 'wQ2c4XD',
    matchName: 'barbell romanian deadlift',
    tips: [
      'Hinge at hips with a slight knee bend — not a squat',
      'Keep the bar close to your legs throughout',
      'Lower until you feel a deep hamstring stretch',
      'Keep your back flat and chest up',
      'Squeeze glutes to lockout at the top',
    ],
  },
  {
    match: /\blat\s+pull\s*down\b/i,
    exerciseId: '7F1DVzn',
    matchName: 'lat pulldown',
    tips: [
      'Initiate the pull by depressing your shoulder blades first',
      'Pull to your upper chest, not behind your neck',
      'Lean back slightly — keep torso stable',
      'Full extension at the top — don\'t cut the stretch short',
      'Squeeze your lats at the bottom',
    ],
  },
  {
    match: /\bdeadlift\b/i,
    exerciseId: 'nUwVh7b',
    matchName: 'deadlift',
    tips: [
      'Push the floor away — don\'t just pull the bar up',
      'Keep the bar close to your body throughout',
      'Engage your lats by "protecting your armpits"',
      'Drive through your heels, not your toes',
      'Lock out by squeezing glutes — not hyperextending your back',
    ],
  },
  {
    match: /\blunge\b/i,
    exerciseId: 't8iSghb',
    matchName: 'barbell lunge',
    tips: [
      'Keep your torso upright throughout',
      'Front knee tracks directly over your toes',
      'Lower until back knee nearly touches the ground',
      'Drive through your front heel to stand',
      'Keep core braced the entire set',
    ],
  },
  {
    match: /\bcalf\s+raise\b/i,
    exerciseId: '2ORFMoR',
    matchName: 'calf raise',
    tips: [
      'Full range of motion — heels below the platform on the stretch',
      'Pause and squeeze at the top of each rep',
      'Control the descent — don\'t just drop',
      'Keep weight centered through the ball of your foot',
    ],
  },
  {
    match: /\bbicep\s+curl|biceps\s+curl|dumbbell\s+curl\b/i,
    exerciseId: 'q6y3OhV',
    matchName: 'bicep curl',
    tips: [
      'Keep elbows pinned to your sides — no swinging',
      'Full extension at the bottom for maximum stretch',
      'Squeeze hard at the top',
      'Control the negative — 2-3 seconds down',
    ],
  },
  {
    match: /\bpull[\s-]?up\b/i,
    exerciseId: 'lBDjFxJ',
    matchName: 'pull up',
    tips: [
      'Pack your shoulder blades before pulling',
      'Pull your chin over the bar — avoid kipping',
      'Full extension at the bottom each rep',
      'Control the descent — don\'t just drop',
    ],
  },
  {
    match: /\bleg\s+curl\b/i,
    exerciseId: 'Zg3XY7P',
    matchName: 'seated leg curl',
    tips: [
      'Curl through full range of motion',
      'Squeeze hamstrings hard at peak contraction',
      'Control the extension — don\'t let it snap back',
      'Keep hips pressed down throughout',
    ],
  },
  {
    match: /\bleg\s+press\b/i,
    exerciseId: 'Qa55kX1',
    matchName: 'leg press',
    tips: [
      'Feet shoulder-width on the platform',
      'Don\'t lock out knees fully at the top',
      'Lower until thighs reach 90°',
      'Drive through the whole foot evenly',
    ],
  },
  {
    match: /\bshoulder\s+press|overhead\s+press|ohp\b/i,
    exerciseId: 'DsgkuIt',
    matchName: 'shoulder press',
    tips: [
      'Brace your core to avoid excessive lower back arch',
      'Press directly overhead — not in front',
      'Full lockout at the top',
      'Control the bar back down to your collar bone',
    ],
  },
  {
    match: /\blateral\s+raise\b/i,
    exerciseId: 'DsgkuIt',
    matchName: 'dumbbell lateral raise',
    tips: [
      'Lead with your elbows, not your hands',
      'Raise to shoulder height — not higher',
      'Slight forward lean targets side delts better',
      'Control the descent — don\'t drop',
    ],
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 });

    const key = q.toLowerCase();
    if (cache.has(key)) return NextResponse.json({ success: true, ...cache.get(key), cached: true });

    const override = CURATED_OVERRIDES.find((o) => o.match.test(q));
    if (override) {
      const payload = {
        matchName: override.matchName,
        gifUrl: `https://static.exercisedb.dev/media/${override.exerciseId}.gif`,
        exerciseId: override.exerciseId,
        tips: override.tips,
      };
      cache.set(key, payload);
      return NextResponse.json({ success: true, ...payload, curated: true });
    }

    const url = `https://www.exercisedb.dev/api/v1/exercises/search?q=${encodeURIComponent(q)}&limit=6&threshold=0.4`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ success: false, error: 'Lookup failed' }, { status: 200 });

    const data = await res.json();
    const first = data?.data?.[0];
    if (!first?.gifUrl) return NextResponse.json({ success: false, error: 'No match' }, { status: 200 });

    const rawTips: string[] = first.exerciseTips
      ? first.exerciseTips.map((t: string) => t.replace(/^[^:]+:\s*/, '').trim()).filter(Boolean)
      : [];

    const payload = { matchName: first.name, gifUrl: first.gifUrl, exerciseId: first.exerciseId, tips: rawTips };
    cache.set(key, payload);
    return NextResponse.json({ success: true, ...payload });
  } catch {
    return NextResponse.json({ success: false, error: 'Lookup error' }, { status: 200 });
  }
}
