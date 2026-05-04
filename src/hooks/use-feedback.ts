'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type FeedbackType   = 'bug' | 'suggestion' | 'other';
export type FeedbackStatus = 'new' | 'read' | 'resolved';

export interface Feedback {
  id:         string;
  user_id:    string;
  type:       FeedbackType;
  message:    string;
  status:     FeedbackStatus;
  created_at: string;
  // joined
  username?:  string | null;
}

// ─── User: submit feedback ────────────────────────────────────────────────────

export function useSubmitFeedback() {
  const supabase = createClient();
  const qc       = useQueryClient();

  return useMutation({
    mutationFn: async (input: { type: FeedbackType; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        type:    input.type,
        message: input.message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-feedback'] });
      qc.invalidateQueries({ queryKey: ['admin-feedback-count'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Admin: read all feedback ─────────────────────────────────────────────────

export function useAdminFeedback() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async (): Promise<Feedback[]> => {
      // Fetch feedback rows
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with usernames from profiles
      const userIds = [...new Set((data ?? []).map((r: any) => r.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const usernameMap = new Map(
        (profiles ?? []).map((p: any) => [p.id, p.username])
      );

      return (data ?? []).map((r: any) => ({
        ...r,
        username: usernameMap.get(r.user_id) ?? null,
      }));
    },
    staleTime: 60_000,
  });
}

// ─── Admin: count of 'new' feedback (for sidebar badge) ──────────────────────

export function useUnreadFeedbackCount(): number {
  const supabase = createClient();

  const { data = 0 } = useQuery({
    queryKey: ['admin-feedback-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  return data;
}

// ─── Admin: update feedback status ───────────────────────────────────────────

export function useUpdateFeedbackStatus() {
  const supabase = createClient();
  const qc       = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-feedback'] });
      qc.invalidateQueries({ queryKey: ['admin-feedback-count'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
