'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/use-profile';

const USERNAME_REGEX = /^[a-zA-Z0-9_.\-]{3,20}$/;

/**
 * Modal pro stávající uživatele bez nastaveného username.
 * Renderuje se v (app)/layout.tsx — pokud profile.username === null,
 * zobrazí se neuzavíratelný overlay, který blokuje appku, dokud user
 * nezvolí username.
 */
export function UsernameOnboardingDialog() {
  const t = useTranslations();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();

  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const open = !isLoading && !!profile && !profile.username;

  // Debounced kontrola dostupnosti
  useEffect(() => {
    if (!value || !USERNAME_REGEX.test(value)) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_username_available', {
        p_username: value,
      });
      setChecking(false);
      if (error) {
        setAvailable(null);
        return;
      }
      setAvailable(Boolean(data));
    }, 400);
    return () => clearTimeout(handle);
  }, [value, supabase]);

  if (!open) return null;

  const formatValid = USERNAME_REGEX.test(value);
  const canSubmit = formatValid && available === true && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const { error } = await supabase.rpc('set_my_username', { p_username: value });
    setSubmitting(false);
    if (error) {
      const msg = error.message?.includes('username_taken')
        ? t('auth.usernameTaken')
        : error.message?.includes('invalid_format')
          ? t('auth.usernameInvalidFormat')
          : t('common.errorGeneric');
      toast.error(msg);
      return;
    }
    toast.success(t('auth.usernameSet'));
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-xl font-semibold mb-2">{t('auth.chooseUsernameTitle')}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('auth.chooseUsernameDescription')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="onboarding-username">{t('auth.username')}</Label>
            <Input
              id="onboarding-username"
              type="text"
              autoFocus
              required
              minLength={3}
              maxLength={20}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="napr. honza_novak"
            />
            <p className="text-xs text-muted-foreground">
              {t('auth.usernameHint')}
            </p>
            {value && !formatValid && (
              <p className="text-xs text-destructive">{t('auth.usernameInvalidFormat')}</p>
            )}
            {value && formatValid && checking && (
              <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
            )}
            {value && formatValid && !checking && available === true && (
              <p className="text-xs text-emerald-500">{t('auth.usernameAvailable')}</p>
            )}
            {value && formatValid && !checking && available === false && (
              <p className="text-xs text-destructive">{t('auth.usernameTaken')}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {submitting ? t('common.loading') : t('common.save')}
          </Button>
        </form>
      </div>
    </div>
  );
}
