import { createClient } from '@supabase/supabase-js';

/**
 * Supabase klient se service role klíčem — obchází RLS.
 * Používej POUZE v server-side kódu (API routes, Server Actions).
 * NIKDY neexponuj na klienta.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
