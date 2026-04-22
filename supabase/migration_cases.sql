-- ============================================================
-- Cases (CS2-style loot boxes)
-- ============================================================

CREATE OR REPLACE FUNCTION public.open_case(
  p_item_id   text,
  p_case_cost integer
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT coins FROM public.profiles WHERE id = auth.uid()) < p_case_cost THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
     SET coins = coins - p_case_cost
   WHERE id = auth.uid();

  INSERT INTO public.owned_items (user_id, item_id, price_paid)
  VALUES (auth.uid(), p_item_id, 0)
  ON CONFLICT (user_id, item_id) DO NOTHING;

  RETURN true;
END;
$$;
