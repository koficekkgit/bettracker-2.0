'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Naslouchá Supabase Auth eventům a při změně přihlášeného uživatele
 * VYMAŽE celou React Query cache. Tím se zabrání tomu, aby nový user
 * viděl data minulého (kvůli cache).
 *
 * Mountuje se jednou v root layoutu, žádné UI nerendruje.
 */
export function AuthCacheReset() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Nastavit počáteční user ID
    supabase.auth.getUser().then(({ data }) => {
      lastUserId.current = data.user?.id ?? null;
    });

    // Naslouchat změnám
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        lastUserId.current = null;
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Pokud se změnil user ID, vyčisti cache
        if (lastUserId.current !== null && lastUserId.current !== newUserId) {
          queryClient.clear();
        }
        lastUserId.current = newUserId;
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
