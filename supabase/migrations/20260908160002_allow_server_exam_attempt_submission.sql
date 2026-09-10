CREATE OR REPLACE FUNCTION public.prevent_student_exam_attempt_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

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
