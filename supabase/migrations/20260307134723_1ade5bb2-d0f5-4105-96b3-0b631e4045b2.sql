
-- Allow anyone (including anon) to insert profiles for guest checkout
CREATE POLICY "Anyone can create profiles"
ON public.profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anon to view guest profiles
CREATE POLICY "Anon can view guest profiles"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- Allow anon to update guest profiles (user_id is null for guests)
CREATE POLICY "Anon can update guest profiles"
ON public.profiles
FOR UPDATE
TO anon
USING (user_id IS NULL);
