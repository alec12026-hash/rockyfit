'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold tracking-wide text-primary uppercase">
            RockyFit
          </h1>
          <p className="text-secondary mt-2 font-body">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-sm p-6 space-y-4 border border-border">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-sm font-body text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-body font-medium text-secondary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-secondary mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-display font-semibold uppercase tracking-wide rounded-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-secondary mt-6 font-body">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
