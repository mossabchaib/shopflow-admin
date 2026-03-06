
-- Add guest info columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name varchar;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone varchar;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email varchar;

-- Allow anonymous users to insert orders (guest checkout)
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anonymous users to insert order_items
DROP POLICY IF EXISTS "Users can create order_items" ON public.order_items;
CREATE POLICY "Anyone can create order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anonymous users to insert addresses (guest checkout)
DROP POLICY IF EXISTS "Users can create addresses" ON public.addresses;
CREATE POLICY "Anyone can create addresses" ON public.addresses FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anon to view orders they just created (by address)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO anon, authenticated USING ((auth.uid() = customer_id) OR (customer_id IS NULL) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow anon to view order_items for guest orders
DROP POLICY IF EXISTS "Users can view own order_items" ON public.order_items;
CREATE POLICY "Users can view own order_items" ON public.order_items FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id 
    AND ((orders.customer_id = auth.uid()) OR (orders.customer_id IS NULL) OR has_role(auth.uid(), 'admin'::app_role))
  )
);
