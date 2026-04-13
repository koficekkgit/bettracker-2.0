'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type UserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  is_admin: boolean | null;
  payouts_enabled: boolean;
  created_at: string;
};

export function useAllUsers() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, is_admin, payouts_enabled, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserRow[];
    },
  });
}

export function useTogglePayoutsEnabled() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { user_id: string; enabled: boolean }) => {
      // .select() vrací updatované řádky, takže můžeme ověřit, že se něco reálně změnilo
      const { data, error } = await supabase
        .from('profiles')
        .update({ payouts_enabled: input.enabled })
        .eq('id', input.user_id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        // RLS tichý fail — update prošel, ale neaktualizoval žádný řádek
        throw new Error('rls_blocked');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}
