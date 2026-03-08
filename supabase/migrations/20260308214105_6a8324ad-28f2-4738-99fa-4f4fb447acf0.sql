
-- Allow admins to view all user roles (needed for chat user discovery)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow sellers to view admin roles (needed to start chat with admin)
CREATE POLICY "Sellers can view admin roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'seller'::app_role) AND role = 'admin'::app_role);

-- Allow admins to view all profiles for chat
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow sellers to view admin profiles for chat
CREATE POLICY "Sellers can view profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'seller'::app_role));
