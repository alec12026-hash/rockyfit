'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

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
      const res = await fetch('/api/auth/password-reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-display font-bold text-red-600">Invalid Link</h1>
          <p className="text-secondary mt-4">This password reset link is invalid or expired.</p>
          <Link href="/password-reset" className="inline-block mt-6 text-primary font-medium hover:underline">
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-display font-bold text-primary">Password Reset!</h1>
          <p className="text-secondary mt-4">Your password has been updated successfully.</p>
          <Link href="/login" className="inline-block mt-6 text-primary font-medium hover:underline">
            Sign in with new password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold tracking-wide text-primary uppercase">
            RockyFit
          </h1>
          <p className="text-secondary mt-2 font-body">Create new password</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-sm p-6 space-y-4 border border-border">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-sm font-body text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-body font-medium text-secondary mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-secondary mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm p-3 text-primary placeholder:text-zinc-400 focus:outline-none focus:border-primary transition-colors"
              placeholder="Confirm your password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-display font-semibold uppercase tracking-wide rounded-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-secondary mt-6 font-body">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PasswordResetConfirm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>}>
      <ConfirmForm />
    </Suspense>
  );
}
