CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  course TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  total_marks INTEGER NOT NULL CHECK (total_marks > 0),
  passing_marks INTEGER NOT NULL CHECK (passing_marks >= 0 AND passing_marks <= total_marks),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1 CHECK (marks > 0),
  question_order INTEGER NOT NULL CHECK (question_order > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, question_order)
);

CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL CHECK (option_order BETWEEN 1 AND 4),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (question_id, option_order)
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.exams FROM PUBLIC;
REVOKE ALL ON TABLE public.questions FROM PUBLIC;
REVOKE ALL ON TABLE public.question_options FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_options TO authenticated;

CREATE OR REPLACE FUNCTION public.set_exam_management_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_exam_management_updated_at() FROM PUBLIC;

CREATE TRIGGER exams_set_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.set_exam_management_updated_at();

CREATE POLICY "Admins manage exams"
ON public.exams
FOR ALL
TO authenticated
USING ((SELECT public.is_exam_admin()))
WITH CHECK ((SELECT public.is_exam_admin()));

CREATE POLICY "Admins manage questions"
ON public.questions
FOR ALL
TO authenticated
USING ((SELECT public.is_exam_admin()))
WITH CHECK ((SELECT public.is_exam_admin()));

CREATE POLICY "Admins manage question options"
ON public.question_options
FOR ALL
TO authenticated
USING ((SELECT public.is_exam_admin()))
WITH CHECK ((SELECT public.is_exam_admin()));