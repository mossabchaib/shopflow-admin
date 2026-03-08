
-- Add 'seller' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Create stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  logo_url varchar DEFAULT NULL,
  background_url varchar DEFAULT NULL,
  description text DEFAULT NULL,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add store_id to products
ALTER TABLE public.products ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL DEFAULT NULL;

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved stores
CREATE POLICY "Anyone can view approved stores" ON public.stores
  FOR SELECT USING (status = 'approved' OR has_role(auth.uid(), 'admin') OR owner_id = auth.uid());

-- Authenticated users can request a store
CREATE POLICY "Users can request stores" ON public.stores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Sellers can update own store
CREATE POLICY "Sellers can update own store" ON public.stores
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));

-- Admins can delete stores
CREATE POLICY "Admins can delete stores" ON public.stores
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
