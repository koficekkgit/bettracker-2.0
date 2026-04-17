-- Přidej gopay_id do pending_payments pro párování webhook notifikací
ALTER TABLE pending_payments
  ADD COLUMN IF NOT EXISTS gopay_id bigint;

-- Index pro rychlé vyhledávání podle gopay_id v webhook handleru
CREATE INDEX IF NOT EXISTS pending_payments_gopay_id_idx
  ON pending_payments (gopay_id)
  WHERE gopay_id IS NOT NULL;
