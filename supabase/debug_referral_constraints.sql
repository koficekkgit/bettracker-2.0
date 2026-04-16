-- Zobraz všechny constrainty a indexy na tabulce referral_codes
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'referral_codes'::regclass;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'referral_codes';
