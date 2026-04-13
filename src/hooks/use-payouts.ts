'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type PayoutGroup = {
  id: string;
  owner_id: string;
  name: string;
  profit_split_member: number;
  profit_split_owner: number;
  loss_split_member: number;
  loss_split_owner: number;
  referrer_share_pct: number;
  created_at: string;
};

export type PayoutMember = {
  id: string;
  group_id: string;
  user_id: string | null;
  display_name: string | null;
  referrer_member_id: string | null;
  is_active: boolean;
};

export type PayoutPeriod = {
  id: string;
  group_id: string;
  label: string;
  closed_at: string;
  closed_by: string;
  notes: string | null;
};

export type PayoutEntry = {
  id: string;
  period_id: string;
  member_id: string;
  member_pnl: number;
  member_share: number;
  owner_share: number;
  referrer_member_id: string | null;
  referrer_share: number;
  is_paid: boolean;
  paid_at: string | null;
};

export function usePayoutGroups() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['payout-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PayoutGroup[];
    },
  });
}

export function usePayoutGroup(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['payout-group', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_groups')
        .select('*')
        .eq('id', groupId!)
        .single();
      if (error) throw error;
      return data as PayoutGroup;
    },
  });
}

export function usePayoutMembers(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['payout-members', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_group_members')
        .select('*')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as PayoutMember[];
    },
  });
}

export function usePayoutPeriods(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['payout-periods', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_periods')
        .select('*')
        .eq('group_id', groupId!)
        .order('closed_at', { ascending: false });
      if (error) throw error;
      return data as PayoutPeriod[];
    },
  });
}

export function usePayoutEntries(periodId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['payout-entries', periodId],
    enabled: !!periodId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_period_entries')
        .select('*')
        .eq('period_id', periodId!);
      if (error) throw error;
      return data as PayoutEntry[];
    },
  });
}

export function useReferrerBalances(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['payout-referrer-balances', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_referrer_balances')
        .select('*')
        .eq('group_id', groupId!);
      if (error) throw error;
      return data as { referrer_member_id: string; group_id: string; balance: number }[];
    },
  });
}

export function useCreatePayoutGroup() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      profit_split_member: number;
      profit_split_owner: number;
      loss_split_member: number;
      loss_split_owner: number;
      referrer_share_pct: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('not_authenticated');
      const { data, error } = await supabase
        .from('payout_groups')
        .insert({ ...input, owner_id: userData.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-groups'] }),
  });
}

export function useAddMember() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      group_id: string;
      user_id: string | null;
      display_name: string | null;
      referrer_member_id: string | null;
    }) => {
      const { data, error } = await supabase
        .from('payout_group_members')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['payout-members', vars.group_id] }),
  });
}

export function useClosePeriod() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      group_id: string;
      label: string;
      notes: string | null;
      entries: { member_id: string; pnl: number }[];
    }) => {
      const { data, error } = await supabase.rpc('close_payout_period', {
        p_group_id: input.group_id,
        p_label: input.label,
        p_notes: input.notes,
        p_entries: input.entries,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payout-periods', vars.group_id] });
      qc.invalidateQueries({ queryKey: ['payout-referrer-balances', vars.group_id] });
    },
  });
}

export function useTogglePaid() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { entry_id: string; is_paid: boolean }) => {
      const { error } = await supabase
        .from('payout_period_entries')
        .update({
          is_paid: input.is_paid,
          paid_at: input.is_paid ? new Date().toISOString() : null,
        })
        .eq('id', input.entry_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-entries'] }),
  });
}

export function useWithdrawReferrer() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { group_id: string; referrer_member_id: string }) => {
      const { data, error } = await supabase.rpc('withdraw_referrer_balance', {
        p_group_id: input.group_id,
        p_referrer_member_id: input.referrer_member_id,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payout-referrer-balances', vars.group_id] });
    },
  });
}

/** Lookup user by username/email to link a member account */
export function useLookupUser() {
  const supabase = createClient();
  return useMutation({
    mutationFn: async (identifier: string) => {
      // Username lookup přes existující RPC z username login migrace
      const isEmail = identifier.includes('@');
      if (isEmail) {
        // Email lookup necháváme na později (potřeboval by další RPC); zatím vrací null
        return null;
      }
      const { data, error } = await supabase.rpc('get_email_by_username', {
        p_username: identifier,
      });
      if (error || !data) return null;
      // Najdi user_id přes profiles podle username
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('username', identifier)
        .maybeSingle();
      return profile;
    },
  });
}
export function useUpdateMemberReferrer() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      member_id: string;
      group_id: string;
      referrer_member_id: string | null;
    }) => {
      const { error } = await supabase
        .from('payout_group_members')
        .update({ referrer_member_id: input.referrer_member_id })
        .eq('id', input.member_id);
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['payout-members', vars.group_id] }),
  });
}

export function useDeleteGroup() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('payout_groups')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-groups'] }),
  });
}
