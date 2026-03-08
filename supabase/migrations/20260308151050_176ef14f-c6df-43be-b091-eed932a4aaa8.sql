
-- Allow sellers to manage their own store's products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Admins and sellers can manage products" ON public.products
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    (store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores WHERE id = products.store_id AND owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    (store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stores WHERE id = products.store_id AND owner_id = auth.uid()
    ))
  );

-- Allow admins to manage user_roles (for adding seller role)
CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
