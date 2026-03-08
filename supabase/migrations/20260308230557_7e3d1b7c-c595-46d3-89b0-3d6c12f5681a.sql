
-- Review images table
CREATE TABLE public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view review images (same as reviews)
CREATE POLICY "Anyone can view review images"
  ON public.review_images FOR SELECT
  USING (true);

-- Users can insert images for their own reviews
CREATE POLICY "Users can insert own review images"
  ON public.review_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_images.review_id AND r.customer_id = auth.uid()
    )
  );

-- Admins can delete review images
CREATE POLICY "Admins can delete review images"
  ON public.review_images FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
