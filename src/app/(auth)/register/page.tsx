'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const USERNAME_REGEX = /^[a-zA-Z0-9_.\-]{3,20}$/;

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!USERNAME_REGEX.test(username)) {
      toast.error(t('auth.usernameInvalidFormat'));
      return;
    }

    setLoading(true);

    // Pre-check dostupnosti, ať registrace nespadne až na trigger DB
    const { data: available, error: checkErr } = await supabase.rpc('is_username_available', {
      p_username: username,
    });
    if (checkErr) {
      setLoading(false);
      toast.error(t('common.errorGeneric'));
      return;
    }
    if (!available) {
      setLoading(false);
      toast.error(t('auth.usernameTaken'));
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('auth.registerSuccess'));
    router.push('/login');
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="BetTracker" width={64} height={64} className="rounded-lg" />
        </div>
        <CardTitle className="text-2xl">{t('auth.registerTitle')}</CardTitle>
        <CardDescription>BetTracker</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('auth.username')}</Label>
            <Input
              id="username"
              required
              minLength={3}
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('auth.usernameHint')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.register')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
