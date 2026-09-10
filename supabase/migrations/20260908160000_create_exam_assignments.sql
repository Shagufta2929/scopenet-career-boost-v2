CREATE TABLE public.exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'completed')),
  UNIQUE (exam_id, student_id)
);

ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.exam_assignments FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_assignments TO authenticated;

CREATE POLICY "Admins manage exam assignments"
ON public.exam_assignments
FOR ALL
TO authenticated
USING ((SELECT public.is_exam_admin()))
WITH CHECK ((SELECT public.is_exam_admin()));

CREATE POLICY "Students read their own exam assignments"
ON public.exam_assignments
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
);