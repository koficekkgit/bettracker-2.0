'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Group, GroupMember, LeaderboardRow } from '@/lib/types';

export function useMyGroups() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['my-groups'],
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await supabase.rpc('get_my_groups');
      if (error) throw error;
      return (data ?? []) as Group[];
    },
  });
}

export function useGroupMembers(groupId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async (): Promise<GroupMember[]> => {
      // Query group_members table directly — RLS allows members to see their group's members.
      // Avoid relying on the get_group_members RPC which may be broken.
      const { data: memberRows, error: memberError } = await supabase
        .from('group_members')
        .select('user_id, role, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (memberError) throw memberError;
      if (!memberRows?.length) return [];

      const userIds = memberRows.map((m) => m.user_id as string);

      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, character_skin, character_hair, character_hair_color, character_outfit, character_accessory')
        .in('id', userIds);

      if (profileError) throw profileError;

      const profileMap = new Map((profileRows ?? []).map((p) => [p.id as string, p]));

      return memberRows.map((m) => {
        const p = profileMap.get(m.user_id as string);
        return {
          user_id: m.user_id as string,
          role: (m.role as 'owner' | 'member'),
          joined_at: m.joined_at as string,
          username: p?.username ?? null,
          display_name: p?.display_name ?? null,
          character_skin: p?.character_skin ?? null,
          character_hair: p?.character_hair ?? null,
          character_hair_color: p?.character_hair_color ?? null,
          character_outfit: p?.character_outfit ?? null,
          character_accessory: p?.character_accessory ?? null,
        };
      });
    },
    enabled: !!groupId,
    retry: false,
  });
}

export function useGroupLeaderboard(groupId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['group-leaderboard', groupId],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc('get_group_leaderboard', { p_group_id: groupId });
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
    enabled: !!groupId,
    retry: false,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (name: string): Promise<{ group_id: string; invite_code: string }> => {
      const { data, error } = await supabase.rpc('create_group', { p_name: name });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; group_id?: string; invite_code?: string };
      if (!result.success) throw new Error(result.error ?? 'Nepodařilo se vytvořit skupinu');
      if (!result.group_id || !result.invite_code) throw new Error('Neplatná odpověď serveru');
      return { group_id: result.group_id, invite_code: result.invite_code };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success('Skupina vytvořena');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const { data, error } = await supabase.rpc('join_group_by_code', { p_code: code });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; group_name?: string };
      if (!result.success) {
        const msg = result.error === 'invalid_code' ? 'Neplatný kód skupiny'
          : result.error === 'already_member' ? 'Už jsi členem této skupiny'
          : 'Nepodařilo se připojit ke skupině';
        throw new Error(msg);
      }
      return result.group_name ?? '';
    },
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success(`Připojen ke skupině ${name}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: ['my-groups'] });
      qc.invalidateQueries({ queryKey: ['group-leaderboard', groupId] });
      toast.success('Opustil jsi skupinu');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success('Skupina smazána');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useKickMember() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase.rpc('kick_group_member', {
        p_group_id: groupId,
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ['group-members', groupId] });
      qc.invalidateQueries({ queryKey: ['group-leaderboard', groupId] });
      toast.success('Člen odebrán');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
