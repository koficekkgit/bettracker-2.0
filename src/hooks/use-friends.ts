'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Bet, FriendWithProfile, LeaderboardRow, Profile } from '@/lib/types';
import { toast } from 'sonner';

/** Počet čekajících příchozích friend requestů (pro badge v sidebaru). */
export function usePendingFriendRequestCount() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['pending-friend-requests-count'],
    queryFn: async (): Promise<number> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', user.id)
        .eq('status', 'pending');
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

/**
 * Načte všechny friendships přihlášeného usera (přijaté i čekající),
 * spojené s profile druhého usera. Vrací jednotný formát.
 */
export function useFriends() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['friends'],
    queryFn: async (): Promise<FriendWithProfile[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (error) throw error;
      if (!friendships || friendships.length === 0) return [];

      // Posbírat ID druhých uživatelů
      const otherIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', otherIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return friendships.map((f) => {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const profile = profileMap.get(friendId);
        const direction: FriendWithProfile['direction'] =
          f.status === 'accepted'
            ? 'accepted'
            : f.requester_id === user.id
            ? 'outgoing'
            : 'incoming';
        return {
          friendship_id: f.id,
          friend_id: friendId,
          username: profile?.username ?? null,
          display_name: profile?.display_name ?? null,
          status: f.status,
          direction,
        };
      });
    },
  });
}

/**
 * Najdi profil podle username - pro vyhledávání kamošů
 */
export function useSearchProfile(username: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['profile-search', username],
    queryFn: async (): Promise<Profile | null> => {
      if (!username || username.length < 2) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${username}%`)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: username.length >= 2,
  });
}

/**
 * Pošli žádost o přátelství
 */
export function useSendFriendRequest() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (user.id === addresseeId) throw new Error('Nemůžeš si poslat žádost sám sobě');

      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Žádost odeslána');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Přijmi žádost o přátelství
 */
export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Přijato');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Smaž (odmítni / odeber) friendship
 */
export function useRemoveFriend() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Odebráno');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Načti sázky konkrétního přítele - díky RLS to projde jen pokud jsi friend
 */
export function useFriendBets(friendId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['friend-bets', friendId],
    queryFn: async (): Promise<Bet[]> => {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', friendId)
        .order('placed_at', { ascending: false });
      if (error) throw error;
      return data as Bet[];
    },
    enabled: !!friendId,
  });
}

/**
 * Načti profil přítele podle username
 */
export function useFriendProfileByUsername(username: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['friend-profile', username],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
}

/**
 * Leaderboard - globální, top 50 podle ROI za 30 dní (bez zisku)
 */
export function useLeaderboard() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase
        .from('leaderboard_30d')
        .select('*')
        .limit(50);
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
  });
}

/**
 * Leaderboard - jen přátelé + já, se ziskem (přes RPC SECURITY DEFINER)
 */
export function useFriendsLeaderboard() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['friends-leaderboard'],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc('get_friends_leaderboard');
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
  });
}
