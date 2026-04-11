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
      const { data, error } = await supabase
        .from('bets')
        .select('*')
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
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateBet() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (input: BetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
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
    onError: (e: Error) => toast.error(e.message),
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
