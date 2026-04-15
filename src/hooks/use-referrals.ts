'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ReferralCode, ReferralUse } from '@/lib/types';

/** Vrátí referral kód přihlášeného usera (pokud mu ho admin přiřadil). */
export function useMyReferralCode() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['my-referral-code'],
    queryFn: async (): Promise<ReferralCode | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return (data as ReferralCode | null) ?? null;
    },
  });
}

/** Vrátí výdělky referrera (jako owner). */
export function useMyReferralEarnings() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['my-referral-earnings'],
    queryFn: async (): Promise<ReferralUse[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('referral_uses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReferralUse[];
    },
  });
}

/** Validuje referral kód před platbou. */
export function useValidateReferralCode() {
  const supabase = createClient();
  return useMutation({
    mutationFn: async (code: string): Promise<{ valid: boolean; error?: string }> => {
      const { data, error } = await supabase.rpc('validate_referral_code', {
        input_code: code,
      });
      if (error) throw error;
      return data as { valid: boolean; error?: string };
    },
  });
}

// ── Admin hooky ──────────────────────────────────────────────

/** Admin: všechny referral kódy */
export function useAllReferralCodes() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['all-referral-codes'],
    queryFn: async (): Promise<ReferralCode[]> => {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReferralCode[];
    },
  });
}

/** Admin: vytvoř a přiřaď referral kód userovi */
export function useCreateReferralCode() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, owner_id }: { code: string; owner_id: string }) => {
      const { error } = await supabase
        .from('referral_codes')
        .insert({ code: code.toUpperCase().trim(), owner_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-referral-codes'] }),
  });
}

/** Admin: deaktivuj referral kód */
export function useDeactivateReferralCode() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-referral-codes'] }),
  });
}

/** Admin: všechny referral uses */
export function useAllReferralUses() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['all-referral-uses'],
    queryFn: async (): Promise<ReferralUse[]> => {
      const { data, error } = await supabase
        .from('referral_uses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReferralUse[];
    },
  });
}

/** Admin: označ referral use jako vyplacený */
export function useMarkReferralPaidOut() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('referral_uses')
        .update({ paid_out: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-referral-uses'] }),
  });
}
