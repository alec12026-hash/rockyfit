'use client';

import { useEffect, useState } from 'react';
import { PlayCircle, X } from 'lucide-react';
import { EXERCISE_INFO } from '@/lib/exerciseInfo';
import MuscleAnatomyView, { MUSCLE_LABELS } from '@/app/components/MuscleAnatomyView';

interface ExerciseInfoSheetProps {
  exerciseId: string | null;
  onClose: () => void;
}

export default function ExerciseInfoSheet({ exerciseId, onClose }: ExerciseInfoSheetProps) {
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
  }, [exerciseId]);

  if (!exerciseId) return null;

  const exerciseData = EXERCISE_INFO[exerciseId];

  if (!exerciseData) return null;

  const displayName = exerciseId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const { primary, secondary } = exerciseData.muscles;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="bg-surface max-w-md mx-auto rounded-t-lg shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-zinc-300 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-200">
            <h2 className="font-display font-bold text-lg uppercase text-primary">{displayName}</h2>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-primary transition-colors rounded-sm">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 flex-1 space-y-4">
            <div className="rounded-md overflow-hidden border border-zinc-200 bg-zinc-950">
              {!videoFailed ? (
                <video
                  key={exerciseData.demo.src}
                  className="w-full h-52 object-cover"
                  src={exerciseData.demo.src}
                  poster={exerciseData.demo.poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  preload="metadata"
                  onError={() => setVideoFailed(true)}
                />
              ) : (
                <div className="h-52 flex items-center justify-center text-center px-4">
                  <div>
                    <PlayCircle className="mx-auto mb-2 text-zinc-500" size={28} />
                    <p className="text-zinc-300 font-body text-sm">Exercise demo processing.</p>
                    <p className="text-zinc-500 font-body text-xs">Upload /public/exercise-demos/{exerciseId}.mp4</p>
                  </div>
                </div>
              )}
              <div className="px-3 py-2 border-t border-zinc-800 text-[10px] uppercase tracking-wider font-display text-zinc-400">
                Demo Video
              </div>
            </div>

            <MuscleAnatomyView primary={primary} secondary={secondary} />

            <div className="space-y-3">
              <div>
                <span className="font-display font-bold text-[10px] uppercase tracking-wider text-secondary mr-2">Primary:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {primary.map((muscle) => (
                    <span key={muscle} className="px-2 py-1 bg-[#DFFF00] text-zinc-900 text-xs font-body font-medium rounded-sm">
                      {MUSCLE_LABELS[muscle]}
                    </span>
                  ))}
                </div>
              </div>

              {secondary.length > 0 && (
                <div>
                  <span className="font-display font-bold text-[10px] uppercase tracking-wider text-secondary mr-2">Secondary:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {secondary.map((muscle) => (
                      <span key={muscle} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-body font-medium rounded-sm">
                        {MUSCLE_LABELS[muscle]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr className="border-zinc-200" />

            <div>
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-500 mb-3">Form Tips</h3>
              <ul className="space-y-2">
                {exerciseData.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2 text-sm font-body text-primary">
                    <span className="text-accent font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
