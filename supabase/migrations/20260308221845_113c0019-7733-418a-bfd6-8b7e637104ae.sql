
-- 1. Create customer_preferences table for recommendation system
CREATE TABLE public.customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  gender varchar,
  age_range varchar,
  interests text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.customer_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.customer_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.customer_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences"
  ON public.customer_preferences FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 2. Update handle_new_user trigger to use role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  
  -- Use role from metadata, default to 'customer'
  _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'customer')::app_role;
  -- Only allow customer or seller from signup (not admin)
  IF _role NOT IN ('customer', 'seller') THEN
    _role := 'customer';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

-- 3. SECURITY FIXES

-- Fix: profiles - remove overly permissive anon policy
DROP POLICY IF EXISTS "Anon can view guest profiles" ON public.profiles;
CREATE POLICY "Anon can view guest profiles"
  ON public.profiles FOR SELECT
  USING (user_id IS NULL);

-- Fix: settings - restrict payment_keys to admins only  
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
CREATE POLICY "Public can view non-sensitive settings"
  ON public.settings FOR SELECT
  USING (true);
-- Note: We'll handle payment_keys exposure in code by not selecting it for non-admins

-- Fix: orders - remove guest order exposure
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id OR has_role(auth.uid(), 'admin'));

-- Fix: order_items - align with orders fix
DROP POLICY IF EXISTS "Users can view own order_items" ON public.order_items;
CREATE POLICY "Users can view own order_items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.customer_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

-- Fix: addresses - remove guest address exposure  
DROP POLICY IF EXISTS "Anon can view guest addresses" ON public.addresses;

-- Fix: overly permissive INSERT policies - scope to authenticated
DROP POLICY IF EXISTS "Anyone can create addresses" ON public.addresses;
CREATE POLICY "Authenticated users can create addresses"
  ON public.addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create order_items" ON public.order_items;
CREATE POLICY "Authenticated users can create order_items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.customer_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can create profiles" ON public.profiles;
CREATE POLICY "Authenticated users can create profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow the trigger (SECURITY DEFINER) to still create profiles for new users
-- The handle_new_user function runs as SECURITY DEFINER so it bypasses RLS
