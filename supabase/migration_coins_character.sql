-- ============================================================
-- SM Coins + Character customization migration
-- ============================================================

-- 1. Add coins + character columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coins          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coins_synced   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS character_skin       text NOT NULL DEFAULT 'skin_default',
  ADD COLUMN IF NOT EXISTS character_hair       text NOT NULL DEFAULT 'hair_short',
  ADD COLUMN IF NOT EXISTS character_hair_color text NOT NULL DEFAULT 'hc_black',
  ADD COLUMN IF NOT EXISTS character_outfit     text NOT NULL DEFAULT 'outfit_basic',
  ADD COLUMN IF NOT EXISTS character_accessory  text NOT NULL DEFAULT 'acc_none';

-- 2. Owned items table
CREATE TABLE IF NOT EXISTS public.owned_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id      text        NOT NULL,
  price_paid   integer     NOT NULL DEFAULT 0,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE public.owned_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owned_items_all_own" ON public.owned_items;
CREATE POLICY "owned_items_all_own" ON public.owned_items
  FOR ALL USING (auth.uid() = user_id);

-- 3. sync_coins RPC
--    Adds only the delta (p_total_earned - coins_synced) to balance.
--    Never subtracts — spending is handled separately by buy_item.
CREATE OR REPLACE FUNCTION public.sync_coins(p_total_earned integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_delta     integer;
  v_new_coins integer;
BEGIN
  SELECT GREATEST(0, p_total_earned - coins_synced)
    INTO v_delta
    FROM public.profiles
   WHERE id = auth.uid();

  UPDATE public.profiles
     SET coins        = coins + v_delta,
         coins_synced = GREATEST(coins_synced, p_total_earned)
   WHERE id = auth.uid()
     AND p_total_earned > coins_synced;

  SELECT coins INTO v_new_coins
    FROM public.profiles
   WHERE id = auth.uid();

  RETURN COALESCE(v_new_coins, 0);
END;
$$;

-- 4. buy_item RPC — atomic deduct + insert
CREATE OR REPLACE FUNCTION public.buy_item(p_item_id text, p_price integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Already owned → free re-equip
  IF EXISTS (SELECT 1 FROM public.owned_items WHERE user_id = auth.uid() AND item_id = p_item_id) THEN
    RETURN true;
  END IF;

  -- Check balance
  IF (SELECT coins FROM public.profiles WHERE id = auth.uid()) < p_price THEN
    RETURN false;
  END IF;

  -- Deduct
  UPDATE public.profiles
     SET coins = coins - p_price
   WHERE id = auth.uid();

  -- Record ownership
  INSERT INTO public.owned_items (user_id, item_id, price_paid)
  VALUES (auth.uid(), p_item_id, p_price)
  ON CONFLICT (user_id, item_id) DO NOTHING;

  RETURN true;
END;
$$;

-- 5. equip_item RPC — update character slot
CREATE OR REPLACE FUNCTION public.equip_item(p_slot text, p_item_id text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  CASE p_slot
    WHEN 'skin'       THEN UPDATE public.profiles SET character_skin       = p_item_id WHERE id = auth.uid();
    WHEN 'hair'       THEN UPDATE public.profiles SET character_hair       = p_item_id WHERE id = auth.uid();
    WHEN 'hair_color' THEN UPDATE public.profiles SET character_hair_color = p_item_id WHERE id = auth.uid();
    WHEN 'outfit'     THEN UPDATE public.profiles SET character_outfit     = p_item_id WHERE id = auth.uid();
    WHEN 'accessory'  THEN UPDATE public.profiles SET character_accessory  = p_item_id WHERE id = auth.uid();
    ELSE NULL;
  END CASE;
END;
$$;
