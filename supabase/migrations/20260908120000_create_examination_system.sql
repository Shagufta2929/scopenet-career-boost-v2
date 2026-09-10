-- Online examination system

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  duration TEXT NOT NULL DEFAULT 'Contact Institute',
  fees TEXT,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 600),
  passing_percentage NUMERIC(5, 2) NOT NULL DEFAULT 40 CHECK (passing_percentage BETWEEN 0 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL CHECK (char_length(question_text) BETWEEN 1 AND 2000),
  display_order INTEGER NOT NULL CHECK (display_order > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, display_order)
);

CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL CHECK (char_length(option_text) BETWEEN 1 AND 500),
  display_order INTEGER NOT NULL CHECK (display_order > 0),
  UNIQUE (question_id, display_order)
);

-- Kept separate so student-readable question queries cannot expose the answer key.
CREATE TABLE public.exam_question_keys (
  question_id UUID PRIMARY KEY REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  correct_option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
  percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
  passed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE RESTRICT,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE RESTRICT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.course_enrollments (student_id, course_id)
  SELECT NEW.id, id
  FROM public.courses
  WHERE id = NULLIF(NEW.raw_user_meta_data ->> 'course_id', '')::UUID
  ON CONFLICT (student_id, course_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name)
SELECT id, NULLIF(COALESCE(raw_user_meta_data ->> 'full_name', ''), '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.start_exam(p_exam_id UUID)
RETURNS public.exam_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_attempt public.exam_attempts;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RAISE EXCEPTION 'Only students can start exams';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.exams e
    JOIN public.course_enrollments ce ON ce.course_id = e.course_id
    WHERE e.id = p_exam_id
      AND e.is_active
      AND ce.student_id = auth.uid()
      AND ce.is_active
  ) THEN
    RAISE EXCEPTION 'Exam is not available for this student';
  END IF;

  INSERT INTO public.exam_attempts (exam_id, student_id, total_questions)
  SELECT p_exam_id, auth.uid(), COUNT(*)::INTEGER
  FROM public.exam_questions
  WHERE exam_id = p_exam_id
  RETURNING * INTO new_attempt;

  RETURN new_attempt;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_exam(p_attempt_id UUID)
RETURNS public.exam_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_attempt public.exam_attempts;
  correct_count INTEGER;
  question_count INTEGER;
BEGIN
  SELECT * INTO target_attempt
  FROM public.exam_attempts
  WHERE id = p_attempt_id
    AND student_id = auth.uid()
  FOR UPDATE;

  IF target_attempt.id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  IF target_attempt.status = 'submitted' THEN
    RETURN target_attempt;
  END IF;

  SELECT COUNT(*)::INTEGER INTO question_count
  FROM public.exam_questions
  WHERE exam_id = target_attempt.exam_id;

  SELECT COUNT(*)::INTEGER INTO correct_count
  FROM public.exam_answers ea
  JOIN public.exam_question_keys eqk ON eqk.question_id = ea.question_id
  WHERE ea.attempt_id = p_attempt_id
    AND ea.selected_option_id = eqk.correct_option_id;

  UPDATE public.exam_attempts ea
  SET status = 'submitted',
      submitted_at = now(),
      score = correct_count,
      total_questions = question_count,
      percentage = CASE WHEN question_count = 0 THEN 0 ELSE ROUND((correct_count::NUMERIC / question_count) * 100, 2) END,
      passed = CASE
        WHEN question_count = 0 THEN false
        ELSE ROUND((correct_count::NUMERIC / question_count) * 100, 2) >= (
          SELECT passing_percentage FROM public.exams WHERE id = target_attempt.exam_id
        )
      END
  WHERE ea.id = p_attempt_id
  RETURNING * INTO target_attempt;

  RETURN target_attempt;
END;
$$;

INSERT INTO public.courses (slug, name, duration, fees, description)
VALUES
  ('ccc-ms-cit-ms-office', 'CCC / MS-CIT / MS Office', '2 to 3 Months', '₹3,500', 'Build essential computer, internet, and office productivity skills.'),
  ('tally-advanced-tally-gst', 'Tally + Advanced Tally + GST', '4 to 5 Months', '₹5,500', 'Learn practical accounting workflows, advanced Tally, and GST fundamentals.'),
  ('advanced-excel', 'Advanced Excel', '2 Months', '₹3,000', 'Strengthen spreadsheet skills for efficient analysis, reporting, and office work.'),
  ('graphic-designing', 'Graphic Designing', '4 to 5 Months', '₹6,000', 'Develop practical visual design skills for creative and professional projects.'),
  ('english-speaking', 'English Speaking', '6 Months', '₹4,000', 'Improve spoken English and everyday communication with guided practice.'),
  ('ccc-tally', 'CCC + Tally', '6 Months', '₹7,000', 'Combine computer fundamentals with practical business accounting skills.'),
  ('ccc-tally-advanced-excel', 'CCC + Tally + Advanced Excel', '8 to 9 Months', '₹10,000', 'A broad skill path covering computers, accounting, and advanced spreadsheets.'),
  ('ccas', 'CCAS', '10 to 12 Months', '₹13,000', 'An advanced program designed to develop a wider range of computer skills.'),
  ('ccas-es', 'CCAS + E.S.', 'Contact Institute', '₹16,000', 'A combined advanced computer and English speaking learning program.'),
  ('web-development', 'Web Development', '3 to 6 Months', NULL, 'Learn to create modern, responsive and user-friendly websites.'),
  ('full-stack-development', 'Full Stack Development', '6 to 9 Months', NULL, 'Learn frontend and backend development and build complete applications.'),
  ('video-editing', 'Video Editing', '2 to 4 Months', NULL, 'Learn professional video editing techniques for digital platforms.'),
  ('animation', 'Animation', '6 to 12 Months', NULL, 'Learn animation concepts and creative techniques for digital content.'),
  ('data-science', 'Data Science', '6 to 9 Months', NULL, 'Learn data handling, analysis, visualization and machine learning concepts.'),
  ('social-media-marketing', 'Social Media Marketing', '2 to 3 Months', NULL, 'Learn to create, manage and grow social media campaigns.'),
  ('ai-machine-learning', 'AI / Machine Learning', '6 to 9 Months', NULL, 'Learn the fundamentals of Artificial Intelligence and Machine Learning.'),
  ('data-analysis-power-bi', 'Data Analysis with Power BI', '2 to 3 Months', NULL, 'Learn data analysis, dashboards and interactive business visualization.')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_question_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;
GRANT SELECT ON public.exams, public.exam_questions, public.question_options TO authenticated;
GRANT SELECT ON public.exam_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.exam_answers TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_exam(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam(UUID) TO authenticated;

CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Students view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Students update own name" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = 'student');
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Students view own enrollments" ON public.course_enrollments FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students create own enrollment" ON public.course_enrollments FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage enrollments" ON public.course_enrollments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Students view available exams" ON public.exams FOR SELECT USING (
  public.is_admin() OR (
    is_active AND EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = exams.course_id AND ce.student_id = auth.uid() AND ce.is_active
    )
  )
);
CREATE POLICY "Admins manage exams" ON public.exams FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Students view exam questions" ON public.exam_questions FOR SELECT USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.exams e
    JOIN public.course_enrollments ce ON ce.course_id = e.course_id
    WHERE e.id = exam_id AND e.is_active AND ce.student_id = auth.uid() AND ce.is_active
  )
);
CREATE POLICY "Admins manage questions" ON public.exam_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Students view question options" ON public.question_options FOR SELECT USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.exam_questions q
    JOIN public.exams e ON e.id = q.exam_id
    JOIN public.course_enrollments ce ON ce.course_id = e.course_id
    WHERE q.id = question_id AND e.is_active AND ce.student_id = auth.uid() AND ce.is_active
  )
);
CREATE POLICY "Admins manage options" ON public.question_options FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage answer keys" ON public.exam_question_keys FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Students view own attempts" ON public.exam_attempts FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage attempts" ON public.exam_attempts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Students view own answers" ON public.exam_answers FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid())
);
CREATE POLICY "Students save own answers" ON public.exam_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress')
);
CREATE POLICY "Students change own answers" ON public.exam_answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress')
);
CREATE POLICY "Admins manage answers" ON public.exam_answers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
