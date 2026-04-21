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
      if (data) {
        // Ensure privacy fields have defaults if column doesn't exist yet
        data.show_profit_to_friends = data.show_profit_to_friends ?? true;
        data.show_bets_to_friends   = data.show_bets_to_friends   ?? true;
      }
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
        show_profit_to_friends: profile.show_profit_to_friends,
        show_bets_to_friends: profile.show_bets_to_friends,
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

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('settings.privacy')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('settings.privacyDesc')}</p>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium">{t('settings.showProfitToFriends')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.showProfitToFriendsDesc')}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profile.show_profit_to_friends}
              onClick={() => setProfile({ ...profile, show_profit_to_friends: !profile.show_profit_to_friends })}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${profile.show_profit_to_friends ? 'bg-primary' : 'bg-input'}`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${profile.show_profit_to_friends ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium">{t('settings.showBetsToFriends')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.showBetsToFriendsDesc')}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profile.show_bets_to_friends}
              onClick={() => setProfile({ ...profile, show_bets_to_friends: !profile.show_bets_to_friends })}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${profile.show_bets_to_friends ? 'bg-primary' : 'bg-input'}`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${profile.show_bets_to_friends ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </label>
          <div className="pt-1">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReferralPanel />

      <CategoriesManager />
    </div>
  );
}
