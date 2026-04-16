'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PendingPayment, SubscriptionPlan } from '@/lib/types';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';
import { toast } from 'sonner';

/**
 * Aktivní pending payment (status='pending') přihlášeného uživatele.
 * Většinou je jen 0 nebo 1 - když user vygeneruje novou, starou zrušíme.
 */
export function useMyPendingPayment() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['my-pending-payment'],
    queryFn: async (): Promise<PendingPayment | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PendingPayment | null;
    },
    refetchInterval: 30_000, // refresh každých 30s, abychom zachytili matching z cronu
  });
}

/**
 * Vytvoří nový pending payment pro daný plán a vrátí ho.
 * Předtím zruší případné existující pending payments uživatele.
 */
export function useCreatePendingPayment() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      plan,
      referralCode,
      discountPct,
    }: {
      plan: SubscriptionPlan;
      referralCode?: string;
      discountPct?: number;
    }): Promise<PendingPayment> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Zrušíme existující pendings
      await supabase
        .from('pending_payments')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      // Získáme nový VS
      const { data: vsData, error: vsError } = await supabase.rpc('next_payment_vs');
      if (vsError) throw vsError;
      const variableSymbol = vsData as number;

      // Vypočítej cenu (s případnou slevou)
      const planInfo = SUBSCRIPTION_PLANS[plan];
      const originalAmount = planInfo.price;
      const finalAmount = referralCode && discountPct
        ? Math.round(originalAmount * (1 - discountPct / 100))
        : originalAmount;

      const { data, error } = await supabase
        .from('pending_payments')
        .insert({
          user_id: user.id,
          variable_symbol: variableSymbol,
          plan,
          amount: finalAmount,
          original_amount: originalAmount,
          currency: 'CZK',
          status: 'pending',
          referral_code: referralCode ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PendingPayment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-pending-payment'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Zruší aktivní pending payment uživatele
 */
export function useCancelPendingPayment() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('pending_payments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-pending-payment'] });
      toast.success('Platba zrušena');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
