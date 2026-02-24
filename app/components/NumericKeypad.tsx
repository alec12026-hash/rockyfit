'use client';

import { X, Delete } from 'lucide-react';

interface NumericKeypadProps {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  label: string;
}

export default function NumericKeypad({ value, onChange, onClose, label }: NumericKeypadProps) {
  const handlePress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      onChange(value + key);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Keypad Sheet */}
      <div className="relative bg-surface rounded-t-xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">{label}</span>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-primary">
            <X size={20} />
          </button>
        </div>

        {/* Display */}
        <div className="mb-6 bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-center">
          <span className="font-mono text-4xl font-bold text-primary tracking-widest">
            {value || <span className="text-zinc-300">--</span>}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePress(num.toString())}
              className="h-16 bg-white border border-zinc-200 rounded-lg shadow-sm text-2xl font-bold active:scale-95 active:bg-zinc-50 transition-all text-primary font-display"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={() => handlePress('.')}
            className="h-16 bg-white border border-zinc-200 rounded-lg shadow-sm text-2xl font-bold active:scale-95 active:bg-zinc-50 transition-all text-primary font-display"
          >
            .
          </button>
          
          <button
            onClick={() => handlePress('0')}
            className="h-16 bg-white border border-zinc-200 rounded-lg shadow-sm text-2xl font-bold active:scale-95 active:bg-zinc-50 transition-all text-primary font-display"
          >
            0
          </button>

          <button
            onClick={() => handlePress('backspace')}
            className="h-16 bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm flex items-center justify-center text-zinc-500 active:scale-95 active:bg-zinc-200 transition-all"
          >
            <Delete size={24} />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-primary text-white font-display font-bold text-lg uppercase rounded-lg shadow-lg active:scale-[0.98] transition-transform"
        >
          Done
        </button>
      </div>
    </div>
  );
}
