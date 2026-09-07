CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL CHECK (char_length(student_name) BETWEEN 2 AND 80),
  course_name TEXT NOT NULL CHECK (char_length(course_name) BETWEEN 2 AND 120),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_message TEXT NOT NULL CHECK (char_length(review_message) BETWEEN 10 AND 1000),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can submit reviews" ON public.reviews
  FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload review photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'review-photos');

CREATE POLICY "Anyone can view review photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'review-photos');
