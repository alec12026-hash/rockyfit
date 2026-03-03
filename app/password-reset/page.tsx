'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setSubmitted(true);
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
          <p className="text-secondary mt-2 font-body">Reset your password</p>
        </div>

        {submitted ? (
          <div className="bg-surface rounded-sm p-6 border border-border text-center">
            <div className="text-green-600 text-xl mb-4">✓</div>
            <p className="text-primary font-body">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent password reset instructions.
            </p>
            <p className="text-secondary text-sm mt-4">
              Check your inbox (and spam folder).
            </p>
            <Link href="/login" className="inline-block mt-6 text-primary font-medium hover:underline">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="bg-surface rounded-sm p-6 space-y-4 border border-border">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-sm font-body text-sm">
                  {error}
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-display font-semibold uppercase tracking-wide rounded-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-secondary mt-6 font-body">
              Remember your password?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
