'use client';

import { useSignIn } from '@clerk/nextjs/legacy';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

type Step = 'email' | 'code' | 'done';

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 — send reset code to email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setStep('code');
    } catch (err: unknown) {
      const error = err as { errors?: { message: string }[] };
      setError(error.errors?.[0]?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify code + set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setStep('done');
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err: unknown) {
      const error = err as { errors?: { message: string }[] };
      setError(error.errors?.[0]?.message || 'Invalid code or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F0F7FF] dark:bg-[#0f0f1a] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">

          {/* ── Step 1: Enter email ── */}
          {step === 'email' && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mb-4">
                  <svg width="22" height="22" fill="none" stroke="#7C3AED" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Forgot password?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your email and we&apos;ll send you a reset code.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isLoaded}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send reset code'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                Remembered it?{' '}
                <Link href="/sign-in" className="text-[#7C3AED] font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: Enter code + new password ── */}
          {step === 'code' && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mb-4">
                  <svg width="22" height="22" fill="none" stroke="#7C3AED" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Check your email
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We sent a reset code to{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Reset code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition tracking-[0.3em] text-center font-mono text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6 || !newPassword}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                Wrong email?{' '}
                <button
                  onClick={() => { setStep('email'); setError(''); setCode(''); setNewPassword(''); }}
                  className="text-[#7C3AED] font-medium hover:underline"
                >
                  Go back
                </button>
              </p>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg width="26" height="26" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Password reset!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your password has been updated. Redirecting to dashboard...
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}