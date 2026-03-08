
-- ============================================
-- 1. Commissions / platform fees table
-- ============================================
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_total numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 10,
  commission_amount numeric NOT NULL DEFAULT 0,
  seller_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage commissions" ON public.commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can view own commissions" ON public.commissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = commissions.store_id AND stores.owner_id = auth.uid()));

-- ============================================
-- 2. Store coupons table
-- ============================================
CREATE TABLE public.store_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code varchar NOT NULL,
  discount_type public.discount_type NOT NULL,
  discount_value numeric NOT NULL,
  min_order_value numeric DEFAULT 0,
  usage_limit int DEFAULT NULL,
  usage_count int DEFAULT 0,
  expires_at timestamptz DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, code)
);
ALTER TABLE public.store_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active store coupons" ON public.store_coupons FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM stores WHERE stores.id = store_coupons.store_id AND stores.owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Store owners can manage own coupons" ON public.store_coupons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_coupons.store_id AND stores.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_coupons.store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all store coupons" ON public.store_coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. Auto-decrement inventory trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrement product stock
  UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) - NEW.quantity) WHERE id = NEW.product_id;
  
  -- Decrement variant stock if size+color specified
  IF NEW.size_id IS NOT NULL AND NEW.color_id IS NOT NULL THEN
    UPDATE product_variants SET stock = GREATEST(0, stock - NEW.quantity) WHERE product_id = NEW.product_id AND size_id = NEW.size_id AND color_id = NEW.color_id;
  END IF;
  
  -- Decrement color stock
  IF NEW.color_id IS NOT NULL THEN
    UPDATE product_colors SET stock = GREATEST(0, stock - NEW.quantity) WHERE id = NEW.color_id;
  END IF;
  
  -- Decrement size stock
  IF NEW.size_id IS NOT NULL THEN
    UPDATE product_sizes SET stock = GREATEST(0, COALESCE(stock, 0) - NEW.quantity) WHERE id = NEW.size_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_order();

-- ============================================
-- 4. Restore stock on cancellation trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Restore stock for all items in this order
    UPDATE products p SET stock = COALESCE(p.stock, 0) + oi.quantity
    FROM order_items oi WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    
    UPDATE product_variants pv SET stock = pv.stock + oi.quantity
    FROM order_items oi WHERE oi.order_id = NEW.id AND oi.product_id = pv.product_id AND oi.size_id = pv.size_id AND oi.color_id = pv.color_id AND oi.size_id IS NOT NULL AND oi.color_id IS NOT NULL;
    
    UPDATE product_colors pc SET stock = pc.stock + oi.quantity
    FROM order_items oi WHERE oi.order_id = NEW.id AND oi.color_id = pc.id;
    
    UPDATE product_sizes ps SET stock = COALESCE(ps.stock, 0) + oi.quantity
    FROM order_items oi WHERE oi.order_id = NEW.id AND oi.size_id = ps.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restore_stock_on_cancel
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_stock_on_cancel();

-- ============================================
-- 5. Auto-create commission on paid order
-- ============================================
CREATE OR REPLACE FUNCTION public.create_commission_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
  v_rate numeric := 10;
  v_commission numeric;
  v_seller_amount numeric;
BEGIN
  IF (OLD.status IS DISTINCT FROM 'paid') AND NEW.status = 'paid' THEN
    -- Get store from order items
    SELECT DISTINCT p.store_id INTO v_store_id
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id AND p.store_id IS NOT NULL
    LIMIT 1;
    
    IF v_store_id IS NOT NULL THEN
      v_commission := ROUND(NEW.total * v_rate / 100, 2);
      v_seller_amount := NEW.total - v_commission;
      
      INSERT INTO commissions (order_id, store_id, order_total, commission_rate, commission_amount, seller_amount)
      VALUES (NEW.id, v_store_id, NEW.total, v_rate, v_commission, v_seller_amount);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_commission_on_paid();

-- ============================================
-- 6. Auto-request review notification after delivery
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_review_after_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM 'delivered') AND NEW.status = 'delivered' AND NEW.customer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (NEW.customer_id, 'Rate your purchase', 'Your order has been delivered! Please leave a review.', 'review_request', '/account');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_review
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_review_after_delivery();

-- ============================================
-- 7. Low stock notification trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF NEW.stock <= 5 AND (OLD.stock IS NULL OR OLD.stock > 5) THEN
    -- Notify store owner if product belongs to a store
    SELECT s.owner_id INTO v_owner_id FROM stores s WHERE s.id = NEW.store_id;
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (v_owner_id, 'Low Stock Alert', 'Product "' || NEW.name || '" has only ' || NEW.stock || ' items left.', 'low_stock', '/admin/products');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_low_stock_notify
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_low_stock();
