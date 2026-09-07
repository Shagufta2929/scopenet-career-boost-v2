CREATE TABLE public.enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  course TEXT NOT NULL,
  batch TEXT,
  message TEXT,
  whatsapp_status TEXT NOT NULL DEFAULT 'pending',
  whatsapp_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.enquiries TO service_role;

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages enquiries" ON public.enquiries FOR ALL TO service_role USING (true) WITH CHECK (true);