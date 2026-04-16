-- Povolit více kódů na uživatele, ale jen jeden aktivní najednou.
-- Odstraní případný unique constraint na owner_id a nahradí ho partial indexem.

-- 1. Smaž starý unique constraint na owner_id (pokud existuje)
ALTER TABLE referral_codes DROP CONSTRAINT IF EXISTS referral_codes_owner_id_key;

-- 2. Přidej partial unique index — unikátní jen pro aktivní kódy
CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_owner_active_unique
  ON referral_codes (owner_id)
  WHERE is_active = true;
