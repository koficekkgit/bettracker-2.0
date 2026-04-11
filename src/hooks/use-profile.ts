'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export function useProfile() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
