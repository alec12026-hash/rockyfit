'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PlayCircle, X } from 'lucide-react';
import { EXERCISE_INFO } from '@/lib/exerciseInfo';
import MuscleAnatomyView, { MUSCLE_LABELS } from '@/app/components/MuscleAnatomyView';

interface ExerciseInfoSheetProps {
  exerciseId: string | null;
  exerciseName?: string;
  onClose: () => void;
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

export default function ExerciseInfoSheet({ exerciseId, exerciseName, onClose }: ExerciseInfoSheetProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [remoteGifUrl, setRemoteGifUrl] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  const safeExerciseId = exerciseId || '';
  const exerciseData = safeExerciseId ? EXERCISE_INFO[safeExerciseId] : undefined;
  const displayName = exerciseName || safeExerciseId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fallbackSlug = useMemo(() => slugifyName(displayName || 'exercise'), [displayName]);
  const localFallbackDemo = {
    src: `/exercise-demos/by-name/${fallbackSlug}.mp4`,
    poster: `/exercise-demos/by-name/${fallbackSlug}.jpg`,
  };

  const demo = exerciseData?.demo || localFallbackDemo;
  const hasMuscleData = Boolean(exerciseData?.muscles);

  useEffect(() => {
    setVideoFailed(false);
    setRemoteGifUrl(null);
    setDragY(0);
  }, [exerciseId, exerciseName]);

  const onDragStart = (clientY: number) => {
    dragStartY.current = clientY;
  };

  const onDragMove = (clientY: number) => {
    if (dragStartY.current == null) return;
    const delta = clientY - dragStartY.current;
    setDragY(Math.max(0, delta));
  };

  const onDragEnd = () => {
    if (dragY > 110) {
      onClose();
    }
    dragStartY.current = null;
    setDragY(0);
  };

  useEffect(() => {
    if (!exerciseId || exerciseData || !exerciseName) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/exercise/search?q=${encodeURIComponent(exerciseName)}`);
        const data = await res.json();
        if (!cancelled && data?.success && data?.gifUrl) {
          setRemoteGifUrl(data.gifUrl);
        }
      } catch {
        // ignore lookup failures
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exerciseId, exerciseData, exerciseName]);

  if (!exerciseId) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 top-[4vh] z-50 animate-in slide-in-from-bottom duration-300 ease-out">
        <div
          className="bg-surface max-w-lg mx-auto rounded-t-lg shadow-2xl h-full overflow-hidden flex flex-col transition-transform duration-150"
          style={{ transform: `translateY(${dragY}px)` }}
        >
          <div
            className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => onDragStart(e.clientY)}
            onMouseMove={(e) => onDragMove(e.clientY)}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
            onTouchEnd={onDragEnd}
          >
            <div className="w-12 h-1.5 bg-zinc-300 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-200">
            <h2 className="font-display font-bold text-lg uppercase text-primary">{displayName}</h2>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-primary transition-colors rounded-sm">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain p-4 pb-24 flex-1 space-y-4">
            <div className="rounded-md overflow-hidden border border-zinc-200 bg-zinc-950">
              {!videoFailed ? (
                <div className="w-full max-h-[56vh] bg-zinc-950 flex items-center justify-center">
                  <video
                    key={demo.src}
                    className="w-full max-h-[56vh] aspect-[9/16] object-contain bg-zinc-950"
                    src={demo.src}
                    poster={demo.poster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    preload="metadata"
                    onError={() => setVideoFailed(true)}
                  />
                </div>
              ) : remoteGifUrl ? (
                <div className="w-full max-h-[56vh] bg-zinc-950 flex items-center justify-center">
                  <img src={remoteGifUrl} alt={`${displayName} animation`} className="w-full max-h-[56vh] aspect-[9/16] object-contain bg-zinc-900" />
                </div>
              ) : (
                <div className="h-[48vh] min-h-[280px] flex items-center justify-center text-center px-4">
                  <div>
                    <PlayCircle className="mx-auto mb-2 text-zinc-500" size={28} />
                    <p className="text-zinc-300 font-body text-sm">Finding animation for this exercise...</p>
                    <p className="text-zinc-500 font-body text-xs">{displayName}</p>
                  </div>
                </div>
              )}
              <div className="px-3 py-2 border-t border-zinc-800 text-[10px] uppercase tracking-wider font-display text-zinc-400">
                Demo Animation
              </div>
            </div>

            {exerciseData?.tips?.length ? (
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
            ) : null}

            {hasMuscleData && (
              <>
                <MuscleAnatomyView primary={exerciseData!.muscles.primary} secondary={exerciseData!.muscles.secondary} />

                <div className="space-y-3">
                  <div>
                    <span className="font-display font-bold text-[10px] uppercase tracking-wider text-secondary mr-2">Primary:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {exerciseData!.muscles.primary.map((muscle) => (
                        <span key={muscle} className="px-2 py-1 bg-[#DFFF00] text-zinc-900 text-xs font-body font-medium rounded-sm">
                          {MUSCLE_LABELS[muscle]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {exerciseData!.muscles.secondary.length > 0 && (
                    <div>
                      <span className="font-display font-bold text-[10px] uppercase tracking-wider text-secondary mr-2">Secondary:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {exerciseData!.muscles.secondary.map((muscle) => (
                          <span key={muscle} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-body font-medium rounded-sm">
                            {MUSCLE_LABELS[muscle]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
