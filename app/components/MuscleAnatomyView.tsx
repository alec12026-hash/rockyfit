'use client';

import { motion } from 'framer-motion';

export type MuscleGroup = 
  | 'chest' | 'front_delts' | 'side_delts' | 'rear_delts'
  | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques'
  | 'quads' | 'hamstrings' | 'calves' | 'glutes'
  | 'lats' | 'traps' | 'upper_back' | 'lower_back';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  front_delts: 'Front Delts',
  side_delts: 'Side Delts',
  rear_delts: 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  glutes: 'Glutes',
  lats: 'Lats',
  traps: 'Traps',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
};

interface MuscleAnatomyViewProps {
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
}

// Front view muscle shapes
const frontMuscles: Record<string, React.ReactNode> = {
  chest: (
    <>
      <ellipse cx="40" cy="62" rx="12" ry="9" />
      <ellipse cx="70" cy="62" rx="12" ry="9" />
    </>
  ),
  front_delts: (
    <>
      <ellipse cx="21" cy="47" rx="9" ry="8" />
      <ellipse cx="89" cy="47" rx="9" ry="8" />
    </>
  ),
  side_delts: (
    <>
      <ellipse cx="13" cy="55" rx="7" ry="9" />
      <ellipse cx="97" cy="55" rx="7" ry="9" />
    </>
  ),
  biceps: (
    <>
      <ellipse cx="16" cy="60" rx="6" ry="13" />
      <ellipse cx="94" cy="60" rx="6" ry="13" />
    </>
  ),
  forearms: (
    <>
      <ellipse cx="16" cy="91" rx="6" ry="14" />
      <ellipse cx="94" cy="91" rx="6" ry="14" />
    </>
  ),
  abs: (
    <>
      <ellipse cx="47" cy="73" rx="7" ry="5" />
      <ellipse cx="63" cy="73" rx="7" ry="5" />
      <ellipse cx="47" cy="85" rx="7" ry="5" />
      <ellipse cx="63" cy="85" rx="7" ry="5" />
      <ellipse cx="47" cy="97" rx="7" ry="5" />
      <ellipse cx="63" cy="97" rx="7" ry="5" />
    </>
  ),
  obliques: (
    <>
      <ellipse cx="31" cy="87" rx="7" ry="13" transform="rotate(-10 31 87)" />
      <ellipse cx="79" cy="87" rx="7" ry="13" transform="rotate(10 79 87)" />
    </>
  ),
  quads: (
    <>
      <ellipse cx="41" cy="146" rx="13" ry="26" />
      <ellipse cx="69" cy="146" rx="13" ry="26" />
    </>
  ),
  calves: (
    <>
      <ellipse cx="41" cy="203" rx="9" ry="20" />
      <ellipse cx="69" cy="203" rx="9" ry="20" />
    </>
  ),
};

// Back view muscle shapes
const backMuscles: Record<string, React.ReactNode> = {
  traps: (
    <path d="M 33 40 Q 43 35 55 33 Q 67 35 77 40 Q 68 56 55 59 Q 42 56 33 40 Z" />
  ),
  rear_delts: (
    <>
      <ellipse cx="21" cy="47" rx="9" ry="8" />
      <ellipse cx="89" cy="47" rx="9" ry="8" />
    </>
  ),
  lats: (
    <>
      <path d="M 28 56 Q 23 70 25 86 Q 27 97 33 104 L 46 107 Q 40 97 37 86 Q 33 70 34 56 Z" />
      <path d="M 82 56 Q 87 70 85 86 Q 83 97 77 104 L 64 107 Q 70 97 73 86 Q 77 70 76 56 Z" />
    </>
  ),
  triceps: (
    <>
      <ellipse cx="16" cy="60" rx="7" ry="14" />
      <ellipse cx="94" cy="60" rx="7" ry="14" />
    </>
  ),
  upper_back: (
    <ellipse cx="55" cy="67" rx="18" ry="12" />
  ),
  lower_back: (
    <ellipse cx="55" cy="95" rx="20" ry="10" />
  ),
  glutes: (
    <>
      <ellipse cx="40" cy="127" rx="15" ry="13" />
      <ellipse cx="70" cy="127" rx="15" ry="13" />
    </>
  ),
  hamstrings: (
    <>
      <ellipse cx="41" cy="152" rx="13" ry="26" />
      <ellipse cx="69" cy="152" rx="13" ry="26" />
    </>
  ),
  calves: (
    <>
      <ellipse cx="41" cy="206" rx="10" ry="21" />
      <ellipse cx="69" cy="206" rx="10" ry="21" />
    </>
  ),
};

// Body base shapes (same for front and back)
const bodyBase = (
  <>
    {/* Head */}
    <circle cx="55" cy="14" r="11" />
    {/* Neck */}
    <rect x="50" y="25" width="10" height="10" rx="3" />
    {/* Shoulder block */}
    <rect x="22" y="35" width="66" height="19" rx="9" />
    {/* Left upper arm */}
    <rect x="10" y="37" width="16" height="38" rx="7" />
    {/* Right upper arm */}
    <rect x="84" y="37" width="16" height="38" rx="7" />
    {/* Left forearm */}
    <rect x="10" y="76" width="14" height="34" rx="6" />
    {/* Right forearm */}
    <rect x="86" y="76" width="14" height="34" rx="6" />
    {/* Torso */}
    <path d="M 24 42 L 22 106 Q 28 114 40 115 L 55 116 L 70 115 Q 82 114 88 106 L 86 42 Z" />
    {/* Left upper leg */}
    <rect x="30" y="115" width="22" height="57" rx="10" />
    {/* Right upper leg */}
    <rect x="58" y="115" width="22" height="57" rx="10" />
    {/* Left knee */}
    <ellipse cx="41" cy="173" rx="11" ry="7" />
    {/* Right knee */}
    <ellipse cx="69" cy="173" rx="11" ry="7" />
    {/* Left lower leg */}
    <rect x="31" y="178" width="19" height="47" rx="9" />
    {/* Right lower leg */}
    <rect x="60" y="178" width="19" height="47" rx="9" />
    {/* Left foot */}
    <ellipse cx="43" cy="228" rx="12" ry="6" />
    {/* Right foot */}
    <ellipse cx="67" cy="228" rx="12" ry="6" />
  </>
);

function renderMuscleGroup(
  muscleName: string,
  muscles: Record<string, React.ReactNode>,
  primary: MuscleGroup[],
  secondary: MuscleGroup[]
) {
  const node = muscles[muscleName];
  if (!node) return null;

  const isPrimary = primary.includes(muscleName as MuscleGroup);
  const isSecondary = secondary.includes(muscleName as MuscleGroup);

  let fill = '#3f3f46'; // zinc-700 (inactive)
  if (isPrimary) {
    fill = '#DFFF00'; // volt
  } else if (isSecondary) {
    fill = '#a1a1aa'; // zinc-400
  }

  if (isPrimary) {
    return (
      <motion.g
        key={muscleName}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'url(#glow-volt)' }}
      >
        <g fill={fill}>{node}</g>
      </motion.g>
    );
  }

  return (
    <g key={muscleName} fill={fill}>
      {node}
    </g>
  );
}

export default function MuscleAnatomyView({ primary, secondary = [] }: MuscleAnatomyViewProps) {
  const frontMuscleKeys = Object.keys(frontMuscles);
  const backMuscleKeys = Object.keys(backMuscles);

  return (
    <div className="bg-zinc-950 rounded-md p-4">
      <div className="flex justify-center gap-8">
        {/* Front View */}
        <div className="flex flex-col items-center">
          <span className="font-display font-bold text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Front
          </span>
          <svg
            viewBox="0 0 110 235"
            className="w-24 h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="glow-volt" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Body base */}
            <g fill="#27272a">{bodyBase}</g>
            {/* Front muscles */}
            {frontMuscleKeys.map((muscle) =>
              renderMuscleGroup(muscle, frontMuscles, primary, secondary)
            )}
          </svg>
        </div>

        {/* Back View */}
        <div className="flex flex-col items-center">
          <span className="font-display font-bold text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Back
          </span>
          <svg
            viewBox="0 0 110 235"
            className="w-24 h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="glow-volt-back" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Body base */}
            <g fill="#27272a">{bodyBase}</g>
            {/* Back muscles */}
            {backMuscleKeys.map((muscle) => {
              const node = backMuscles[muscle];
              const isPrimary = primary.includes(muscle as MuscleGroup);
              const isSecondary = secondary.includes(muscle as MuscleGroup);

              let fill = '#3f3f46';
              if (isPrimary) {
                fill = '#DFFF00';
              } else if (isSecondary) {
                fill = '#a1a1aa';
              }

              if (isPrimary) {
                return (
                  <motion.g
                    key={muscle}
                    animate={{ opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ filter: 'url(#glow-volt-back)' }}
                  >
                    <g fill={fill}>{node}</g>
                  </motion.g>
                );
              }

              return (
                <g key={muscle} fill={fill}>
                  {node}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#DFFF00]" />
          <span className="text-[10px] font-body text-zinc-400">Primary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-400" />
          <span className="text-[10px] font-body text-zinc-400">Secondary</span>
        </div>
      </div>
    </div>
  );
}
