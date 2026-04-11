'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { LicenseCode, SubscriptionPlan } from '@/lib/types';
import { toast } from 'sonner';

const PLAN_DAYS: Record<SubscriptionPlan, number | null> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
  lifetime: null,
};

/**
 * Vygeneruj náhodný kód ve formátu BET-XXXX-XXXX
 * (8 alfanumerických znaků v 2 skupinách po 4)
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez O/0/I/1 ať se to nepleteo
  let code = 'BET-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useAllLicenseCodes() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin-license-codes'],
    queryFn: async (): Promise<LicenseCode[]> => {
      const { data, error } = await supabase
        .from('license_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LicenseCode[];
    },
  });
}

export function useGenerateLicenseCode() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { plan: SubscriptionPlan; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Pokus se vygenerovat unikátní kód (do 5 pokusů)
      for (let i = 0; i < 5; i++) {
        const code = generateCode();
        const { data, error } = await supabase
          .from('license_codes')
          .insert({
            code,
            plan: input.plan,
            valid_for_days: PLAN_DAYS[input.plan],
            note: input.note || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (!error) return data as LicenseCode;
        // Pokud kolize, zkus znovu
        if (!error || (error as any).code !== '23505') throw error;
      }
      throw new Error('Nepodařilo se vygenerovat unikátní kód');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-license-codes'] });
      toast.success('Kód vygenerován');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLicenseCode() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from('license_codes').delete().eq('code', code);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-license-codes'] });
      toast.success('Kód smazán');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
