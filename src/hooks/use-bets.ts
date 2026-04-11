'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Bet, BetInput, Category } from '@/lib/types';
import { toast } from 'sonner';

export function useBets() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['bets'],
    queryFn: async (): Promise<Bet[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false });
      if (error) throw error;
      return data as Bet[];
    },
  });
}

export function useCategories() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (input: { name: string; color?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          color: input.color ?? '#3b82f6',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategorie přidána');
    },
    onError: (e: Error) => {
      // Unique constraint violation
      if (e.message.includes('duplicate') || e.message.includes('unique')) {
        toast.error('Kategorie s tímto názvem už existuje');
      } else {
        toast.error(e.message);
      }
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name?: string; color?: string }) => {
      const patch: { name?: string; color?: string } = {};
      if (name !== undefined) patch.name = name.trim();
      if (color !== undefined) patch.color = color;
      const { error } = await supabase.from('categories').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Uloženo');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['bets'] });
      toast.success('Kategorie smazána');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateBet() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (input: BetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Free limit check - načti profil a count sázek
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_until, trial_ends_at, subscription_plan')
        .eq('id', user.id)
        .single();

      const now = new Date();
      let isPro = false;

      if (profile) {
        // Lifetime
        if (profile.subscription_status === 'pro' && profile.subscription_plan === 'lifetime') {
          isPro = true;
        }
        // Time-limited pro
        else if (
          profile.subscription_status === 'pro' &&
          profile.subscription_until &&
          new Date(profile.subscription_until) > now
        ) {
          isPro = true;
        }
        // Trial
        else if (profile.trial_ends_at && new Date(profile.trial_ends_at) > now) {
          isPro = true;
        }
      }

      if (!isPro) {
        const { count } = await supabase
          .from('bets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if ((count ?? 0) >= 5) {
          throw new Error('FREE_LIMIT_REACHED');
        }
      }

      const { data, error } = await supabase
        .from('bets')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Bet;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] });
      toast.success('Saved');
    },
    onError: (e: Error) => {
      if (e.message === 'FREE_LIMIT_REACHED') {
        toast.error('Dosáhl jsi limitu 5 sázek ve Free verzi. Aktivuj Pro pro neomezené sázky.');
      } else {
        toast.error(e.message);
      }
    },
  });
}

export function useUpdateBet() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<BetInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('bets')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Bet;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] });
      toast.success('Updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBet() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] });
      toast.success('Deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
