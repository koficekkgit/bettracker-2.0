-- Fix: allow reusing a referral code name after it has been deactivated.
-- The global UNIQUE constraint on "code" blocks this even for inactive rows.
-- Replace it with a partial unique index (active codes only).

-- 1. Drop the global unique constraint on code
ALTER TABLE referral_codes
  DROP CONSTRAINT IF EXISTS referral_codes_code_key;

-- 2. Partial unique index: uniqueness enforced only among ACTIVE codes
CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_code_active_unique
  ON referral_codes (code)
  WHERE is_active = true;

-- 3. Also keep: one active code per owner (optional but sensible)
ALTER TABLE referral_codes DROP CONSTRAINT IF EXISTS referral_codes_owner_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_owner_active_unique
  ON referral_codes (owner_id)
  WHERE is_active = true;
