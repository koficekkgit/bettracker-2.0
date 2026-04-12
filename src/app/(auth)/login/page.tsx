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

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let email = identifier.trim();

    // Pokud to nevypadá jako email, zkusíme username lookup
    if (!email.includes('@')) {
      const { data, error: rpcError } = await supabase.rpc('get_email_by_username', {
        p_username: email,
      });
      if (rpcError || !data) {
        setLoading(false);
        toast.error(t('auth.loginError'));
        return;
      }
      email = data as string;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t('auth.loginError'));
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="BetTracker" width={64} height={64} className="rounded-lg" />
        </div>
        <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
        <CardDescription>BetTracker</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">{t('auth.emailOrUsername')}</Label>
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login')}
          </Button>
          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-foreground font-medium hover:underline">
              {t('auth.createAccount')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
