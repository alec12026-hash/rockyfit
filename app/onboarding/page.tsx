'use client';

import { useState } from 'react';
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
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleAnswer = async (value: string) => {
    const newAnswers = { ...answers, [currentQ.key]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Submit
      setLoading(true);
      setError('');
      
      try {
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnswers)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to complete onboarding');
        }
        
        // Redirect to home
        router.push('/');
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Step {step + 1} of {questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            {currentQ.question}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {currentQ.type === 'select' ? (
            <div className="space-y-3">
              {currentQ.options?.map((opt: any) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <textarea
                value={answers[currentQ.key] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })}
                placeholder={currentQ.placeholder}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={4}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleAnswer(answers[currentQ.key] || '')}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : step < questions.length - 1 ? 'Next' : 'Complete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {currentQ.type === 'select' && (
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-gray-400 hover:text-gray-300 text-sm"
          >
            Skip this question
          </button>
        )}
      </div>
    </div>
  );
}
