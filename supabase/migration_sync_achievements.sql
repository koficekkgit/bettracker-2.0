-- RPC funkce pro sync achievements_count (SECURITY DEFINER obchází RLS)
CREATE OR REPLACE FUNCTION sync_achievements_count(p_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET achievements_count = p_count
  WHERE id = auth.uid();
END;
$$;
