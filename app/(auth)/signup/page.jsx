'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { AlertCircle, Chrome, CheckCircle, ArrowRight, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      
      setTimeout(async () => {
        const result = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
          callbackUrl: '/dashboard',
        });

        if (!result?.error) {
          router.push('/dashboard');
          router.refresh();
        }
      }, 1500);
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  if (success) {
    return (
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-0 shadow-2xl shadow-black/5">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
              Account created!
            </h2>
            <p className="text-[var(--color-muted)]">
              Redirecting you to the dashboard...
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Get started with your free account today
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
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={<User className="w-5 h-5" />}
              required
            />
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
                placeholder="Create a strong password"
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
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-accent)]">
              <input
                type="checkbox"
                id="terms"
                className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
                required
              />
              <label htmlFor="terms" className="text-sm text-[var(--color-muted)] leading-relaxed">
                I agree to the{' '}
                <Link href="#" className="font-medium text-[var(--color-primary-500)] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="font-medium text-[var(--color-primary-500)] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-card)] text-[var(--color-muted)]">
                Or sign up with
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
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-sm text-[var(--color-muted)] mt-8">
        By signing up, you agree to our{' '}
        <Link href="#" className="underline hover:text-[var(--color-foreground)]">Terms</Link>
        {' '}and{' '}
        <Link href="#" className="underline hover:text-[var(--color-foreground)]">Privacy Policy</Link>
      </p>
    </div>
  );
}
