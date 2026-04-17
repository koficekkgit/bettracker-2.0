-- RPC pro aktivaci free trialu
CREATE OR REPLACE FUNCTION start_free_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Aktivuj trial jen pokud ještě nebyl spuštěn
  UPDATE profiles
  SET
    trial_ends_at = NOW() + INTERVAL '7 days',
    subscription_status = 'trial'
  WHERE id = auth.uid()
    AND trial_ends_at IS NULL
    AND subscription_status = 'free';
END;
$$;
