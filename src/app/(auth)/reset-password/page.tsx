'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Po kliknutí na link v emailu přijde uživatel sem.
 * Supabase automaticky vytvoří dočasnou session z tokenu v URL hashi
 * (#access_token=...) a my pak jen zavoláme updateUser s novým heslem.
 */
export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Když Supabase zpracuje token z URL, vytvoří session.
    // Posloucháme událost PASSWORD_RECOVERY, která to potvrdí.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasValidSession(true);
      }
    });

    // Také se podíváme, jestli už session existuje (případ kdy user otevře stránku přímo)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasValidSession(true);
      else if (hasValidSession === null) {
        // Dáme tomu chvilku - Supabase potřebuje zpracovat hash z URL
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setHasValidSession(!!session);
          });
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t('auth.passwordUpdated'));
    // Odhlásíme, ať se uživatel přihlásí znovu už s novým heslem
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="BetTracker" width={64} height={64} className="rounded-lg" />
        </div>
        <CardTitle className="text-2xl">{t('auth.newPasswordTitle')}</CardTitle>
        <CardDescription>BetTracker</CardDescription>
      </CardHeader>
      <CardContent>
        {hasValidSession === false ? (
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-danger/10 border border-danger/30">
              <p className="text-sm text-danger">{t('auth.invalidResetLink')}</p>
            </div>
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                {t('auth.forgotPassword')}
              </Button>
            </Link>
          </div>
        ) : hasValidSession === null ? (
          <p className="text-center text-sm text-muted-foreground py-4">{t('common.loading')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.newPasswordConfirm')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.savePassword')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
