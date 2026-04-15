'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CategoriesManager } from '@/components/settings/categories-manager';
import { SubscriptionPanel } from '@/components/subscription/subscription-panel';
import { ReferralPanel } from '@/components/settings/referral-panel';
import { createClient } from '@/lib/supabase/client';
import { CURRENCIES } from '@/lib/utils';
import type { Profile } from '@/lib/types';

export default function SettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    })();
  }, [supabase]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        default_currency: profile.default_currency,
        starting_bankroll: profile.starting_bankroll,
        preferred_language: profile.preferred_language,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    document.cookie = `NEXT_LOCALE=${profile.preferred_language}; path=/; max-age=31536000`;
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success(t('settings.saved'));
    router.refresh();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (loading || !profile) {
    return <div className="text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('settings.profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.displayName')}</Label>
            <Input
              value={profile.display_name ?? ''}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.language')}</Label>
              <Select
                value={profile.preferred_language}
                onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
              >
                <option value="cs">Čeština</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.currency')}</Label>
              <Select
                value={profile.default_currency}
                onChange={(e) => setProfile({ ...profile, default_currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.startingBankroll')}</Label>
            <Input
              type="number"
              step="0.01"
              value={profile.starting_bankroll}
              onChange={(e) =>
                setProfile({ ...profile, starting_bankroll: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.theme')}</Label>
            <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
              <option value="system">{t('settings.themeSystem')}</option>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              {t('auth.logout')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SubscriptionPanel />

      <ReferralPanel />

      <CategoriesManager />
    </div>
  );
}
