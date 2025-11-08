'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin, useRegister } from '@/lib/hooks/useAuth';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const mutation = mode === 'login' ? useLogin() : useRegister();

  const [formData, setFormData] = React.useState(() =>
    mode === 'login'
      ? { email: '', password: '' }
      : { email: '', username: '', password: '', password_confirm: '' }
  );

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await mutation.mutateAsync(formData as any);
      router.push('/calendar');
    } catch (error) {
      // Error is handled by React Query
      console.error('Auth failed:', error);
    }
  };

  const config = {
    login: {
      title: 'Sign In',
      description: 'Enter your email and password to access your account',
      submitText: 'Sign In',
      loadingText: 'Signing in...',
      footerText: "Don't have an account?",
      footerLink: '/register',
      footerLinkText: 'Sign up',
    },
    register: {
      title: 'Create an Account',
      description: 'Enter your information to create your account',
      submitText: 'Create Account',
      loadingText: 'Creating account...',
      footerText: 'Already have an account?',
      footerLink: '/login',
      footerLinkText: 'Sign in',
    },
  }[mode];

  const errorMessage = mutation.error instanceof Error ? mutation.error.message : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange('email')}
                required
                disabled={mutation.isPending}
              />
            </div>

            {mode === 'register' && 'username' in formData && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange('username')}
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="^[a-zA-Z0-9_]+$"
                  disabled={mutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, and underscores allowed
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                value={formData.password}
                onChange={handleChange('password')}
                required
                minLength={8}
                disabled={mutation.isPending}
              />
            </div>

            {mode === 'register' && 'password_confirm' in formData && (
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password</Label>
                <Input
                  id="password_confirm"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.password_confirm}
                  onChange={handleChange('password_confirm')}
                  required
                  disabled={mutation.isPending}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? config.loadingText : config.submitText}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              {config.footerText}{' '}
              <Link href={config.footerLink} className="text-primary hover:underline">
                {config.footerLinkText}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
