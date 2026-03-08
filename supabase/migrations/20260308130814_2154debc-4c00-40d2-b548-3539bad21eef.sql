
-- Drop the existing restrictive INSERT policy on addresses
DROP POLICY IF EXISTS "Anyone can create addresses" ON public.addresses;

-- Create a permissive INSERT policy that allows anon and authenticated
CREATE POLICY "Anyone can create addresses"
ON public.addresses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;

-- Create a permissive SELECT policy for authenticated users and admins
CREATE POLICY "Users can view own addresses"
ON public.addresses
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow anon to read back addresses they just created (where user_id is null)
CREATE POLICY "Anon can view guest addresses"
ON public.addresses
FOR SELECT
TO anon
USING (user_id IS NULL);
