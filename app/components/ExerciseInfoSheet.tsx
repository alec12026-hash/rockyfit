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
  const [remoteTips, setRemoteTips] = useState<string[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const safeExerciseId = exerciseId || '';
  const exerciseData = safeExerciseId ? EXERCISE_INFO[safeExerciseId] : undefined;
  const displayName = exerciseName || safeExerciseId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fallbackSlug = useMemo(() => slugifyName(displayName || 'exercise'), [displayName]);
  const demo = exerciseData?.demo || {
    src: `/exercise-demos/by-name/${fallbackSlug}.mp4`,
    poster: `/exercise-demos/by-name/${fallbackSlug}.jpg`,
  };
  const hasMuscleData = Boolean(exerciseData?.muscles);
  const tips = exerciseData?.tips?.length ? exerciseData.tips : remoteTips;

  useEffect(() => {
    setVideoFailed(false);
    setRemoteGifUrl(null);
    setRemoteTips([]);
    if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  }, [exerciseId, exerciseName]);

  // Fetch remote GIF + tips for dynamic exercises
  useEffect(() => {
    if (!exerciseId || exerciseData) return;
    const name = exerciseName || displayName;
    if (!name) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/exercise/search?q=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.success && data?.gifUrl) setRemoteGifUrl(data.gifUrl);
        if (data?.tips?.length) setRemoteTips(data.tips);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [exerciseId, exerciseData, exerciseName, displayName]);

  // Smooth drag-to-dismiss using direct DOM manipulation (no setState on move)
  const onDragStart = (y: number) => {
    dragStartY.current = y;
    isDragging.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const onDragMove = (y: number) => {
    if (!isDragging.current || dragStartY.current == null || !sheetRef.current) return;
    const delta = Math.max(0, y - dragStartY.current);
    sheetRef.current.style.transform = `translateY(${delta}px)`;
  };

  const onDragEnd = (y: number) => {
    if (!isDragging.current || dragStartY.current == null || !sheetRef.current) return;
    const delta = Math.max(0, y - dragStartY.current);
    isDragging.current = false;
    dragStartY.current = null;

    if (delta > 120) {
      sheetRef.current.style.transition = 'transform 0.25s cubic-bezier(0.32,0.72,0,1)';
      sheetRef.current.style.transform = `translateY(100%)`;
      setTimeout(onClose, 230);
    } else {
      sheetRef.current.style.transition = 'transform 0.35s cubic-bezier(0.32,0.72,0,1)';
      sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  if (!exerciseId) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 top-[4vh] z-50 animate-in slide-in-from-bottom duration-300 ease-out">
        <div ref={sheetRef} className="bg-surface max-w-lg mx-auto rounded-t-xl shadow-2xl h-full flex flex-col overflow-hidden">

          {/* Drag handle */}
          <div
            className="flex-shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={(e) => onDragStart(e.clientY)}
            onMouseMove={(e) => { if (isDragging.current) onDragMove(e.clientY); }}
            onMouseUp={(e) => onDragEnd(e.clientY)}
            onMouseLeave={(e) => { if (isDragging.current) onDragEnd(e.clientY); }}
            onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => { e.preventDefault(); onDragMove(e.touches[0].clientY); }}
            onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientY)}
          >
            <div className="w-12 h-1.5 bg-zinc-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3 border-b border-zinc-200">
            <h2 className="font-display font-bold text-lg uppercase text-primary">{displayName}</h2>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-primary transition-colors rounded-sm">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">

            {/* Flush video/gif block */}
            <div className="w-full bg-black">
              {!videoFailed ? (
                <video
                  key={demo.src}
                  className="w-full aspect-[3/4] object-contain bg-black"
                  src={demo.src}
                  poster={demo.poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setVideoFailed(true)}
                />
              ) : remoteGifUrl ? (
                <img
                  src={remoteGifUrl}
                  alt={`${displayName} animation`}
                  className="w-full aspect-[3/4] object-contain bg-black"
                />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center text-center px-4 bg-zinc-950">
                  <div>
                    <PlayCircle className="mx-auto mb-2 text-zinc-500" size={28} />
                    <p className="text-zinc-400 font-body text-sm">Loading animation…</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Form Tips */}
              {tips.length > 0 && (
                <div>
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-500 mb-3">
                    Form Tips
                  </h3>
                  <ul className="space-y-2.5">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex gap-2.5 text-sm font-body text-primary leading-snug">
                        <span className="text-accent font-bold flex-shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Muscle diagram */}
              {hasMuscleData && (
                <>
                  <MuscleAnatomyView
                    primary={exerciseData!.muscles.primary}
                    secondary={exerciseData!.muscles.secondary}
                  />
                  <div className="space-y-3">
                    <div>
                      <span className="font-display font-bold text-[10px] uppercase tracking-wider text-secondary mr-2">Primary:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {exerciseData!.muscles.primary.map((m) => (
                          <span key={m} className="px-2 py-1 bg-[#DFFF00] text-zinc-900 text-xs font-body font-medium rounded-sm">
                            {MUSCLE_LABELS[m]}
                          </span>
                        ))}
                      </div>
                    </div>
                    {exerciseData!.muscles.secondary.length > 0 && (
                      <div>
                        <span className="font-display font-bold text-[10px] uppercase tracking-wider text-secondary mr-2">Secondary:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {exerciseData!.muscles.secondary.map((m) => (
                            <span key={m} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-body font-medium rounded-sm">
                              {MUSCLE_LABELS[m]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom safe-area padding */}
            <div className="h-16" />
          </div>
        </div>
      </div>
    </>
  );
}
