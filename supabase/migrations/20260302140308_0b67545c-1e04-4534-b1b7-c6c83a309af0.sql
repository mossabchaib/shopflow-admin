
-- Create product_colors table
CREATE TABLE public.product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  color_name varchar NOT NULL,
  color_hex varchar NOT NULL DEFAULT '#000000',
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view product_colors" ON public.product_colors FOR SELECT USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage product_colors" ON public.product_colors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add color_id to cart_items
ALTER TABLE public.cart_items ADD COLUMN color_id uuid REFERENCES public.product_colors(id) ON DELETE SET NULL;

-- Add color_id to order_items
ALTER TABLE public.order_items ADD COLUMN color_id uuid REFERENCES public.product_colors(id) ON DELETE SET NULL;
