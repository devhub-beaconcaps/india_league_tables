'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { AlertCircle, Chrome, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl,
      });

      if (result?.error) {
        setError('Invalid email or password. Try using "password" as the password.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl });
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-blue-500/30">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-[var(--color-background)]" />
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-black/5">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={<Mail className="w-5 h-5" />}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]" 
                />
                <span className="text-[var(--color-muted)]">Remember me</span>
              </label>
              <Link
                href="#"
                className="font-medium text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-card)] text-[var(--color-muted)]">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full h-12"
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
            leftIcon={<Chrome className="w-5 h-5" />}
          >
            Google
          </Button>

          <p className="text-center text-sm text-[var(--color-muted)]">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
            >
              Create one now
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-sm text-[var(--color-muted)] mt-8">
        Protected by reCAPTCHA and subject to our{' '}
        <Link href="#" className="underline hover:text-[var(--color-foreground)]">Privacy Policy</Link>
        {' '}and{' '}
        <Link href="#" className="underline hover:text-[var(--color-foreground)]">Terms of Service</Link>
      </p>
    </div>
  );
}
