-- ============================================================
-- Daily / Weekly Tasks (Časky za coiny)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.claimed_tasks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id    text        NOT NULL,
  period_key text        NOT NULL,  -- e.g. "d_2026-04-22" or "w_2026-W17"
  coins      integer     NOT NULL DEFAULT 0,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id, period_key)
);

ALTER TABLE public.claimed_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "claimed_tasks_all_own" ON public.claimed_tasks;
CREATE POLICY "claimed_tasks_all_own" ON public.claimed_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Atomic: check not already claimed, add coins, insert record
CREATE OR REPLACE FUNCTION public.claim_task(
  p_task_id    text,
  p_period_key text,
  p_coins      integer
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.claimed_tasks
     WHERE user_id    = auth.uid()
       AND task_id    = p_task_id
       AND period_key = p_period_key
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.claimed_tasks (user_id, task_id, period_key, coins)
  VALUES (auth.uid(), p_task_id, p_period_key, p_coins);

  UPDATE public.profiles
     SET coins = coins + p_coins
   WHERE id = auth.uid();

  RETURN true;
END;
$$;
