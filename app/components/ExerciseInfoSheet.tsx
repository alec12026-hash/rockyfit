'use client';

import { X } from 'lucide-react';
import { EXERCISE_INFO } from '@/lib/exerciseInfo';

interface ExerciseInfoSheetProps {
  exerciseId: string | null;
  onClose: () => void;
}

export default function ExerciseInfoSheet({ exerciseId, onClose }: ExerciseInfoSheetProps) {
  if (!exerciseId) return null;

  const exerciseData = EXERCISE_INFO[exerciseId];

  // If no data exists for this exercise, don't render
  if (!exerciseData) {
    return null;
  }

  // Format exercise name for display
  const displayName = exerciseId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="bg-surface max-w-md mx-auto rounded-t-lg shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
          
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-zinc-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-200">
            <h2 className="font-display font-bold text-lg uppercase text-primary">
              {displayName}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-primary transition-colors rounded-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4 flex-1">
            {/* GIF */}
            <div className="bg-zinc-100 rounded-md overflow-hidden mb-4 border border-zinc-200">
              <img 
                src={exerciseData.gifUrl} 
                alt={`${displayName} demonstration`}
                className="w-full h-48 object-contain bg-zinc-50"
              />
            </div>

            {/* Form Tips */}
            <div>
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-secondary mb-3">
                Form Tips
              </h3>
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
