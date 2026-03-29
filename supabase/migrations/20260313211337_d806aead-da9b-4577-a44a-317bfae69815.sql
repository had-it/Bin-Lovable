
-- Karolinska departments table
CREATE TABLE public.karolinska_university_hospital_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.karolinska_university_hospital_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to karolinska departments"
  ON public.karolinska_university_hospital_departments FOR SELECT
  TO public USING (true);

CREATE POLICY "Allow insert to karolinska departments"
  ON public.karolinska_university_hospital_departments FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Allow update to karolinska departments"
  ON public.karolinska_university_hospital_departments FOR UPDATE
  TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete from karolinska departments"
  ON public.karolinska_university_hospital_departments FOR DELETE
  TO public USING (true);

-- Capio departments table
CREATE TABLE public."capio_st_görans_sjukhus_departments" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public."capio_st_görans_sjukhus_departments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to capio departments"
  ON public."capio_st_görans_sjukhus_departments" FOR SELECT
  TO public USING (true);

CREATE POLICY "Allow insert to capio departments"
  ON public."capio_st_görans_sjukhus_departments" FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Allow update to capio departments"
  ON public."capio_st_görans_sjukhus_departments" FOR UPDATE
  TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete from capio departments"
  ON public."capio_st_görans_sjukhus_departments" FOR DELETE
  TO public USING (true);

-- Seed existing departments from bins
INSERT INTO public.karolinska_university_hospital_departments (name)
SELECT DISTINCT department FROM public.karolinska_university_hospital_bins
WHERE department IS NOT NULL AND department != ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public."capio_st_görans_sjukhus_departments" (name)
SELECT DISTINCT department FROM public."capio_st_görans_sjukhus_bins"
WHERE department IS NOT NULL AND department != ''
ON CONFLICT (name) DO NOTHING;
