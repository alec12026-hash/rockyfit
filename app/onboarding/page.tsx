'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const questions = [
  {
    key: 'experience_level',
    question: "What's your lifting experience?",
    type: 'select',
    options: [
      { value: 'beginner', label: 'Beginner (0-1 years)' },
      { value: 'intermediate', label: 'Intermediate (1-3 years)' },
      { value: 'advanced', label: 'Advanced (3+ years)' },
    ]
  },
  {
    key: 'workout_frequency',
    question: "How many days per week do you plan to train?",
    type: 'select',
    options: [
      { value: '2', label: '2 days' },
      { value: '3', label: '3 days' },
      { value: '4', label: '4 days' },
      { value: '5', label: '5 days' },
      { value: '6', label: '6 days' },
    ]
  },
  {
    key: 'goal',
    question: "What's your primary fitness goal?",
    type: 'select',
    options: [
      { value: 'strength', label: 'Build Strength' },
      { value: 'hypertrophy', label: 'Build Muscle (Hypertrophy)' },
      { value: 'general_fitness', label: 'General Fitness' },
    ]
  },
  {
    key: 'equipment',
    question: "What equipment do you have access to?",
    type: 'select',
    options: [
      { value: 'gym', label: 'Full Gym' },
      { value: 'home', label: 'Home Gym (barbell + plates)' },
      { value: 'dumbbells', label: 'Dumbbells Only' },
    ]
  },
  {
    key: 'injuries',
    question: "Any injuries or limitations we should know about?",
    type: 'textarea',
    placeholder: 'e.g., bad knees, lower back issues, shoulder injury...'
  },
  // NEW QUESTIONS
  {
    key: 'age',
    question: "What's your age?",
    type: 'number',
    placeholder: 'e.g., 25'
  },
  {
    key: 'biological_sex',
    question: "What's your biological sex?",
    type: 'select',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ]
  },
  {
    key: 'body_weight',
    question: "What's your current body weight?",
    type: 'number',
    placeholder: 'Weight in lbs, e.g., 175'
  },
  {
    key: 'primary_focus',
    question: "Which body parts do you want to prioritize?",
    type: 'multiselect',
    options: [
      { value: 'chest', label: 'Chest' },
      { value: 'back', label: 'Back' },
      { value: 'legs', label: 'Legs' },
      { value: 'arms', label: 'Arms (Biceps/Triceps)' },
      { value: 'shoulders', label: 'Shoulders' },
      { value: 'core', label: 'Core' },
      { value: 'glutes', label: 'Glutes' },
      { value: 'overall', label: 'Overall Balanced' },
    ]
  },
  {
    key: 'session_duration',
    question: "How long can you train per session?",
    type: 'select',
    options: [
      { value: '45', label: '45 minutes' },
      { value: '60', label: '60 minutes' },
      { value: '75', label: '75 minutes' },
      { value: '90', label: '90 minutes or more' },
    ]
  },
  {
    key: 'coaching_report_time',
    question: "What time would you like to receive your daily coaching report?",
    type: 'select',
    options: [
      { value: '06:00', label: '6:00 AM' },
      { value: '07:00', label: '7:00 AM' },
      { value: '08:00', label: '8:00 AM' },
      { value: '09:00', label: '9:00 AM' },
      { value: '12:00', label: '12:00 PM (Noon)' },
      { value: '17:00', label: '5:00 PM' },
      { value: '18:00', label: '6:00 PM' },
      { value: '19:00', label: '7:00 PM' },
      { value: '20:00', label: '8:00 PM' },
      { value: '21:00', label: '9:00 PM' },
    ]
  },
  {
    key: 'sleep_quality',
    question: "How would you rate your sleep quality?",
    type: 'select',
    options: [
      { value: 'poor', label: 'Poor' },
      { value: 'average', label: 'Average' },
      { value: 'good', label: 'Good' },
    ]
  },
  {
    key: 'stress_level',
    question: "What's your current stress level?",
    type: 'select',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' },
    ]
  }
];

const loadingMessages = [
  "Researching optimal exercises for your goals...",
  "Analyzing science-based training principles...",
  "Personalizing your program structure...",
  "Selecting exercises based on your experience...",
  "Building your weekly split...",
  "Finalizing your plan..."
];

type ProgramData = {
  programName: string;
  weeks: number;
  daysPerWeek: number;
  goal: string;
  focus: string;
  progressionScheme: string;
  recoveryNotes: string;
  researchSummary?: string;
  whyBuiltThisWay?: string;
  sourcesUsed?: Array<{ title: string; url?: string; snippet: string }>;
  days: Array<{
    dayNumber: number;
    name: string;
    muscleGroups: string[];
    scienceRationale: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: string;
      rationale: string;
    }>;
  }>;
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [error, setError] = useState('');

  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  // Rotating loading messages
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [generating]);

  const handleMultiNext = async () => {
    const value = multiSelections.join(',');
    setMultiSelections([]);
    await handleAnswer(value);
  };

  const toggleMultiSelection = (value: string) => {
    setMultiSelections(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleAnswer = async (value: string) => {
    const newAnswers = { ...answers, [currentQ.key]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Last question - trigger loading screen then generate program
      setLoading(true);
      setGenerating(true);
      setError('');

      try {
        // First save onboarding responses
        const saveRes = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnswers)
        });

        const saveData = await saveRes.json();

        if (!saveRes.ok) {
          throw new Error(saveData.error || 'Failed to save onboarding');
        }

        // Send welcome email (non-blocking, don't wait)
        fetch('/api/email/welcome', { method: 'POST' }).catch(console.error);

        // Then generate the program
        const programRes = await fetch('/api/program/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const programData = await programRes.json();

        if (!programRes.ok) {
          throw new Error(programData.error || 'Failed to generate program');
        }

        // Show program summary
        setProgram(programData);
        setGenerating(false);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        setGenerating(false);
      }
    }
  };

  const handleSkip = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleAnswer('');
    }
  };

  // Loading screen
  if (loading && generating) {
    return (
      <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-display font-bold tracking-wide text-primary uppercase mb-8">
            RockyFit
          </h1>
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-lg font-display font-semibold uppercase tracking-wide text-primary mb-2">
            Generating Your Program
          </p>
          <p className="text-secondary font-body animate-pulse">
            {loadingMessages[loadingMessageIndex]}
          </p>
        </div>
      </div>
    );
  }

  // Program summary screen
  if (program) {
    return (
      <div className="min-h-screen bg-background text-primary p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-surface rounded-sm border border-border p-6 mt-8">
            <h1 className="text-2xl font-display font-bold uppercase tracking-wide text-primary mb-6 text-center">
              Your Personalized Program
            </h1>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-lg font-display font-semibold text-primary">
                {program.programName}
              </p>
              <div className="flex gap-4 mt-2 text-sm font-body text-secondary">
                <span>{program.weeks} weeks</span>
                <span>{program.daysPerWeek} days/week</span>
                <span className="capitalize">{program.focus}</span>
              </div>
            </div>

            <div className="space-y-6">
              {program.days.slice(0, 4).map((day) => (
                <div key={day.dayNumber} className="border border-border rounded-sm p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display font-semibold text-primary">
                      Day {day.dayNumber}: {day.name}
                    </h3>
                    <span className="text-xs font-body text-secondary capitalize">
                      {day.muscleGroups.join(', ')}
                    </span>
                  </div>
                  <p className="text-xs font-body text-secondary mb-3 italic">
                    {day.scienceRationale}
                  </p>
                  <div className="space-y-1">
                    {day.exercises.slice(0, 4).map((ex, i) => (
                      <div key={i} className="flex justify-between text-sm font-body">
                        <span className="text-primary">{ex.name}</span>
                        <span className="text-secondary">{ex.sets}x{ex.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {program.days.length > 4 && (
              <p className="text-center text-sm font-body text-secondary mt-4">
                + {program.days.length - 4} more training days
              </p>
            )}

            <div className="mt-6 p-4 border border-border rounded-sm bg-zinc-50 space-y-3">
              <p className="text-xs font-display uppercase tracking-wide text-secondary">Research-informed rationale</p>
              <p className="text-sm font-body text-primary leading-relaxed">
                {program.researchSummary || 'This program structure was selected from current evidence-based resistance training research and tailored to your goal, experience level, recovery profile, and prioritized muscle groups.'}
              </p>
              <p className="text-sm font-body text-primary leading-relaxed">
                {program.whyBuiltThisWay || 'We structured your split, exercise selection, and progression to match your training frequency, available session time, and recovery capacity so you can progress sustainably.'}
              </p>
              {program.sourcesUsed && program.sourcesUsed.length > 0 && (
                <div>
                  <p className="text-xs font-display uppercase tracking-wide text-secondary mb-2">Sources reviewed</p>
                  <ul className="space-y-1">
                    {program.sourcesUsed.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs font-body text-primary">
                        • {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="underline hover:no-underline">{s.title}</a> : s.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full mt-6 py-4 bg-primary text-white font-display font-semibold uppercase tracking-wide rounded-sm hover:bg-zinc-800 transition-colors"
            >
              Let&apos;s Get Started →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-secondary text-sm mt-2 text-center font-body">
            Step {step + 1} of {questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="bg-surface rounded-sm p-6 border border-border">
          <h2 className="text-xl font-display font-semibold mb-6 text-primary">
            {currentQ.question}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-sm font-body text-sm mb-4">
              {error}
            </div>
          )}

          {currentQ.type === 'multiselect' ? (
            <div>
              <div className="space-y-3">
                {currentQ.options?.map((opt: any) => {
                  const selected = multiSelections.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleMultiSelection(opt.value)}
                      className={`w-full text-left p-4 border rounded-sm transition-colors font-body ${
                        selected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background text-primary border-border hover:border-primary'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${selected ? 'border-white bg-white' : 'border-zinc-400'}`}>
                          {selected && <span className="text-primary text-xs font-bold">✓</span>}
                        </span>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleMultiNext}
                disabled={multiSelections.length === 0}
                className="w-full mt-4 py-3 bg-primary text-white font-display font-semibold uppercase tracking-wide rounded-sm hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {step < questions.length - 1 ? `Continue (${multiSelections.length} selected)` : 'Generate Program'}
              </button>
            </div>
          ) : currentQ.type === 'select' ? (
            <div className="space-y-3">
              {currentQ.options?.map((opt: any) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full text-left p-4 bg-background border border-border hover:border-primary rounded-sm transition-colors font-body text-primary"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : currentQ.type === 'number' ? (
            <div>
              <input
                type="number"
                value={answers[currentQ.key] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })}
                placeholder={currentQ.placeholder}
                className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors font-body"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-background border border-border hover:border-primary rounded-sm transition-colors font-body text-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleAnswer(answers[currentQ.key] || '')}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-white font-display font-semibold uppercase tracking-wide rounded-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {step < questions.length - 1 ? 'Next' : 'Generate Program'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={answers[currentQ.key] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })}
                placeholder={currentQ.placeholder}
                className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors font-body"
                rows={4}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-background border border-border hover:border-primary rounded-sm transition-colors font-body text-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleAnswer(answers[currentQ.key] || '')}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-white font-display font-semibold uppercase tracking-wide rounded-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {step < questions.length - 1 ? 'Next' : 'Generate Program'}
                </button>
              </div>
            </div>
          )}
        </div>

        {(currentQ.type === 'select' || currentQ.type === 'multiselect') && (
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-secondary hover:text-primary text-sm font-body"
          >
            Skip this question
          </button>
        )}
      </div>
    </div>
  );
}
