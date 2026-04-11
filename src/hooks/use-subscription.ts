'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from './use-profile';
import { toast } from 'sonner';

export type SubscriptionStatus = 'trial' | 'free' | 'pro';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isPro: boolean;
  isTrial: boolean;
  isFree: boolean;
  daysLeft: number | null;       // pro trial nebo časově omezené pro
  expiresAt: Date | null;        // null = lifetime nebo free
  plan: string | null;
  loading: boolean;
}

/**
 * Vrací aktuální stav subscription.
 * Dynamicky spočítá, jestli trial vypršel nebo subscription skončila.
 */
export function useSubscription(): SubscriptionInfo {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return {
      status: 'free',
      isPro: false,
      isTrial: false,
      isFree: true,
      daysLeft: null,
      expiresAt: null,
      plan: null,
      loading: true,
    };
  }

  const now = new Date();

  // 1. Pro lifetime
  if (
    profile.subscription_status === 'pro' &&
    profile.subscription_plan === 'lifetime'
  ) {
    return {
      status: 'pro',
      isPro: true,
      isTrial: false,
      isFree: false,
      daysLeft: null,
      expiresAt: null,
      plan: 'lifetime',
      loading: false,
    };
  }

  // 2. Pro s expirací - kontrola, jestli ještě platí
  if (
    profile.subscription_status === 'pro' &&
    profile.subscription_until
  ) {
    const expiresAt = new Date(profile.subscription_until);
    if (expiresAt > now) {
      const msLeft = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return {
        status: 'pro',
        isPro: true,
        isTrial: false,
        isFree: false,
        daysLeft,
        expiresAt,
        plan: profile.subscription_plan,
        loading: false,
      };
    }
    // Subscription vypršela - spadáme do free
  }

  // 3. Trial - pokud trial_ends_at v budoucnosti
  if (profile.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    if (trialEnd > now) {
      const msLeft = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return {
        status: 'trial',
        isPro: true, // V trialu má plný přístup
        isTrial: true,
        isFree: false,
        daysLeft,
        expiresAt: trialEnd,
        plan: 'trial',
        loading: false,
      };
    }
  }

  // 4. Free
  return {
    status: 'free',
    isPro: false,
    isTrial: false,
    isFree: true,
    daysLeft: null,
    expiresAt: null,
    plan: null,
    loading: false,
  };
}

/**
 * Aktivace license kódu - volá RPC funkci v Supabase
 */
export function useRedeemCode() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('redeem_license_code', {
        input_code: code,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Kód aktivován! Vítej v Pro verzi 🎉');
    },
    onError: (e: Error) => {
      const errorMessages: Record<string, string> = {
        not_authenticated: 'Musíš být přihlášený',
        code_not_found: 'Kód nebyl nalezen',
        code_already_used: 'Tento kód už byl použit',
      };
      toast.error(errorMessages[e.message] ?? e.message);
    },
  });
}
