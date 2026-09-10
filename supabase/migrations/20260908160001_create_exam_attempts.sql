CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'auto_submitted')),
  score NUMERIC NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX exam_attempts_one_active_per_student_exam
ON public.exam_attempts (exam_id, student_id)
WHERE status = 'in_progress';

CREATE TABLE public.exam_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempt_answers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.exam_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.exam_attempt_answers FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempt_answers TO authenticated;

CREATE POLICY "Admins manage exam attempts"
ON public.exam_attempts
FOR ALL
TO authenticated
USING ((SELECT public.is_exam_admin()))
WITH CHECK ((SELECT public.is_exam_admin()));

CREATE POLICY "Students read their own exam attempts"
ON public.exam_attempts
FOR SELECT
TO authenticated
USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Students create assigned exam attempts"
ON public.exam_attempts
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.exam_assignments
    WHERE public.exam_assignments.exam_id = exam_attempts.exam_id
      AND public.exam_assignments.student_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Students update their own active attempts"
ON public.exam_attempts
FOR UPDATE
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  AND status = 'in_progress'
)
WITH CHECK (
  student_id = (SELECT auth.uid())
  AND status IN ('in_progress', 'submitted', 'auto_submitted')
);

CREATE OR REPLACE FUNCTION public.prevent_student_exam_attempt_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
    AND auth.uid() IS NOT NULL
    AND NOT public.is_exam_admin()
    AND (
      NEW.status IS DISTINCT FROM 'in_progress'
      OR NEW.score IS DISTINCT FROM 0
      OR NEW.correct_answers IS DISTINCT FROM 0
      OR NEW.total_questions IS DISTINCT FROM 0
      OR NEW.submitted_at IS NOT NULL
    ) THEN
    RAISE EXCEPTION 'Students cannot set protected exam attempt fields';
  END IF;

  IF auth.uid() IS NOT NULL
    AND NOT public.is_exam_admin()
    AND (
      NEW.exam_id IS DISTINCT FROM OLD.exam_id
      OR NEW.student_id IS DISTINCT FROM OLD.student_id
      OR NEW.score IS DISTINCT FROM OLD.score
      OR NEW.correct_answers IS DISTINCT FROM OLD.correct_answers
      OR NEW.total_questions IS DISTINCT FROM OLD.total_questions
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
    ) THEN
    RAISE EXCEPTION 'Students cannot modify protected exam attempt fields';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER exam_attempts_protect_student_fields
BEFORE UPDATE ON public.exam_attempts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_student_exam_attempt_mutation();

REVOKE ALL ON FUNCTION public.prevent_student_exam_attempt_mutation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_student_exam_attempt_mutation() TO authenticated;

CREATE POLICY "Admins manage exam attempt answers"
ON public.exam_attempt_answers
FOR ALL
TO authenticated
USING ((SELECT public.is_exam_admin()))
WITH CHECK ((SELECT public.is_exam_admin()));

CREATE POLICY "Students read their own exam attempt answers"
ON public.exam_attempt_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_attempts
    WHERE public.exam_attempts.id = exam_attempt_answers.attempt_id
      AND public.exam_attempts.student_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Students create answers for active attempts"
ON public.exam_attempt_answers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.exam_attempts
    WHERE public.exam_attempts.id = exam_attempt_answers.attempt_id
      AND public.exam_attempts.student_id = (SELECT auth.uid())
      AND public.exam_attempts.status = 'in_progress'
  )
);

CREATE POLICY "Students update answers for active attempts"
ON public.exam_attempt_answers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_attempts
    WHERE public.exam_attempts.id = exam_attempt_answers.attempt_id
      AND public.exam_attempts.student_id = (SELECT auth.uid())
      AND public.exam_attempts.status = 'in_progress'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.exam_attempts
    WHERE public.exam_attempts.id = exam_attempt_answers.attempt_id
      AND public.exam_attempts.student_id = (SELECT auth.uid())
      AND public.exam_attempts.status = 'in_progress'
  )
);
