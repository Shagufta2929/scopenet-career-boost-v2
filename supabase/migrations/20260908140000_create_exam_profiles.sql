CREATE TABLE public.profiles (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  student_id TEXT UNIQUE,

  full_name TEXT NOT NULL,

  role TEXT NOT NULL
    CHECK (role IN ('student', 'admin')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.profiles FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles
TO authenticated;

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
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

REVOKE ALL ON FUNCTION public.set_profiles_updated_at()
FROM PUBLIC;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.is_exam_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_exam_admin()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_exam_admin()
TO authenticated;

CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.profiles.id = (SELECT auth.uid())
);

CREATE POLICY "Admins can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_exam_admin())
);

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.is_exam_admin())
);

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_exam_admin())
)
WITH CHECK (
  (SELECT public.is_exam_admin())
);

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_exam_admin())
);