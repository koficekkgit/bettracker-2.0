-- Add discount_pct and reward_pct to referral_codes
ALTER TABLE referral_codes
  ADD COLUMN IF NOT EXISTS discount_pct integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS reward_pct   integer NOT NULL DEFAULT 10;

-- Update validate_referral_code RPC to return percentages
CREATE OR REPLACE FUNCTION validate_referral_code(input_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code referral_codes%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_code
  FROM referral_codes
  WHERE code = upper(trim(input_code))
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'not_found');
  END IF;

  -- Nelze použít vlastní kód
  IF v_code.owner_id = v_user_id THEN
    RETURN json_build_object('valid', false, 'error', 'own_code');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'discount_pct', v_code.discount_pct,
    'reward_pct', v_code.reward_pct
  );
END;
$$;
