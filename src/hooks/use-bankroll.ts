'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { BookmakerAccount, BankrollTransaction, AccountBalance } from '@/lib/bankroll';

export function useBookmakerAccounts() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['bookmaker-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmaker_accounts')
        .select('*')
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as BookmakerAccount[];
    },
  });
}

export type ExtendedAccountBalance = {
  account_id: string;
  user_id: string;
  balance: number;              // potvrzený balance
  balance_expected: number;     // očekávaný balance (vše včetně pending withdrawals)
  pending_withdrawals: number;  // počet čekajících výběrů
};

export function useAccountBalances() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['account-balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmaker_account_balances')
        .select('*');
      if (error) throw error;
      return data as ExtendedAccountBalance[];
    },
  });
}

export function useAccountTransactions(accountId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['bankroll-transactions', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bankroll_transactions')
        .select('*')
        .eq('account_id', accountId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as BankrollTransaction[];
    },
  });
}

export function useCreateAccount() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      template_key: string | null;
      currency: string;
      hard_limit: boolean;
      low_balance_threshold: number | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('not_authenticated');
      const { data, error } = await supabase
        .from('bookmaker_accounts')
        .insert({ ...input, user_id: userData.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as BookmakerAccount;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmaker-accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useUpdateAccount() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      hard_limit?: boolean;
      low_balance_threshold?: number | null;
    }) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from('bookmaker_accounts')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmaker-accounts'] }),
  });
}

export function useArchiveAccount() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookmaker_accounts')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmaker-accounts'] }),
  });
}

export function useAddTransaction() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      account_id: string;
      kind: 'deposit' | 'withdrawal' | 'bonus' | 'adjustment';
      amount: number;
      notes: string | null;
    }) => {
      const { data, error } = await supabase.rpc('bankroll_add_transaction', {
        p_account_id: input.account_id,
        p_kind: input.kind,
        p_amount: input.amount,
        p_notes: input.notes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['account-balances'] });
      qc.invalidateQueries({ queryKey: ['bankroll-transactions', vars.account_id] });
    },
  });
}

export function useSetCurrentBalance() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      account_id: string;
      target_balance: number;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('bankroll_set_current_balance', {
        p_account_id: input.account_id,
        p_target_balance: input.target_balance,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-balances'] });
      qc.invalidateQueries({ queryKey: ['bankroll-transactions'] });
      qc.invalidateQueries({ queryKey: ['bankroll-transactions-all'] });
    },
  });
}

export function useMarkBankrollOnboarded() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('not_authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ bankroll_onboarded_at: new Date().toISOString() })
        .eq('id', userData.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}


export function useConfirmTransaction() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { transaction_id: string; confirmed: boolean }) => {
      const { error } = await supabase.rpc('bankroll_confirm_transaction', {
        p_transaction_id: input.transaction_id,
        p_confirmed: input.confirmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-balances'] });
      qc.invalidateQueries({ queryKey: ['bankroll-transactions'] });
      qc.invalidateQueries({ queryKey: ['bankroll-transactions-all'] });
      qc.invalidateQueries({ queryKey: ['bankroll-pending-withdrawals'] });
    },
  });
}

export function usePendingWithdrawals() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['bankroll-pending-withdrawals'],
    queryFn: async () => {
      // Načte všechny nepotvrzené withdrawals napříč všemi účty usera
      const { data, error } = await supabase
        .from('bankroll_transactions')
        .select('*, bookmaker_accounts!inner(id, name, currency)')
        .eq('kind', 'withdrawal')
        .eq('confirmed', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Array<BankrollTransaction & {
        bookmaker_accounts: { id: string; name: string; currency: string };
      }>;
    },
  });
}
