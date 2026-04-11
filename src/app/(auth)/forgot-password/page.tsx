'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Redirect URL po kliknutí na link v mailu
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    // Z bezpečnostních důvodů nikdy neříkáme, jestli email existuje nebo ne.
    // Vždy ukážeme stejnou zprávu, ať útočník nemůže fishingem zjistit, kdo je registrován.
    if (error) {
      console.error(error);
    }
    setSent(true);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="BetTracker" width={64} height={64} className="rounded-lg" />
        </div>
        <CardTitle className="text-2xl">{t('auth.forgotPasswordTitle')}</CardTitle>
        <CardDescription>{t('auth.forgotPasswordSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-md bg-success/10 border border-success/30">
              <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <p className="text-sm">{t('auth.resetLinkSent')}</p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToLogin')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.sendResetLink')}
            </Button>
            <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3 h-3 inline mr-1" />
              {t('auth.backToLogin')}
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
