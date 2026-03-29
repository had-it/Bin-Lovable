
-- ============================================================
-- Fix RLS on all hospital data tables
-- ============================================================

-- 1. Enable RLS on tables that may not have it
ALTER TABLE public.karolinska_university_hospital_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karolinska_university_hospital_waste ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capio_st_görans_sjukhus_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capio_st_görans_sjukhus_waste ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karolinska_university_hospital_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capio_st_görans_sjukhus_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_event_annotations ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing permissive public policies
-- Karolinska departments
DROP POLICY IF EXISTS "Allow read access to karolinska departments" ON public.karolinska_university_hospital_departments;
DROP POLICY IF EXISTS "Allow insert to karolinska departments" ON public.karolinska_university_hospital_departments;
DROP POLICY IF EXISTS "Allow update to karolinska departments" ON public.karolinska_university_hospital_departments;
DROP POLICY IF EXISTS "Allow delete from karolinska departments" ON public.karolinska_university_hospital_departments;

-- Capio departments
DROP POLICY IF EXISTS "Allow read access to capio departments" ON public.capio_st_görans_sjukhus_departments;
DROP POLICY IF EXISTS "Allow insert to capio departments" ON public.capio_st_görans_sjukhus_departments;
DROP POLICY IF EXISTS "Allow update to capio departments" ON public.capio_st_görans_sjukhus_departments;
DROP POLICY IF EXISTS "Allow delete from capio departments" ON public.capio_st_görans_sjukhus_departments;

-- Karolinska bins/waste
DROP POLICY IF EXISTS "Enable read access for all users" ON public.karolinska_university_hospital_bins;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.karolinska_university_hospital_waste;

-- Drugs
DROP POLICY IF EXISTS "Allow read access to drugs" ON public.drugs;

-- Annotations
DROP POLICY IF EXISTS "Allow all access to annotations" ON public.waste_event_annotations;

-- 3. Create new authenticated-only policies

-- === DRUGS (shared across hospitals, read by all authenticated, write by admins) ===
CREATE POLICY "Authenticated can read drugs"
  ON public.drugs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage drugs"
  ON public.drugs FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));

-- === KAROLINSKA BINS ===
CREATE POLICY "Authenticated can read karolinska bins"
  ON public.karolinska_university_hospital_bins FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage karolinska bins"
  ON public.karolinska_university_hospital_bins FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));

-- === KAROLINSKA WASTE ===
CREATE POLICY "Authenticated can read karolinska waste"
  ON public.karolinska_university_hospital_waste FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage karolinska waste"
  ON public.karolinska_university_hospital_waste FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));

-- === CAPIO BINS ===
CREATE POLICY "Authenticated can read capio bins"
  ON public.capio_st_görans_sjukhus_bins FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage capio bins"
  ON public.capio_st_görans_sjukhus_bins FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));

-- === CAPIO WASTE ===
CREATE POLICY "Authenticated can read capio waste"
  ON public.capio_st_görans_sjukhus_waste FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage capio waste"
  ON public.capio_st_görans_sjukhus_waste FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));

-- === KAROLINSKA DEPARTMENTS ===
CREATE POLICY "Authenticated can read karolinska departments"
  ON public.karolinska_university_hospital_departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage karolinska departments"
  ON public.karolinska_university_hospital_departments FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));

-- === CAPIO DEPARTMENTS ===
CREATE POLICY "Authenticated can read capio departments"
  ON public.capio_st_görans_sjukhus_departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage capio departments"
  ON public.capio_st_görans_sjukhus_departments FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));

-- === WASTE EVENT ANNOTATIONS ===
CREATE POLICY "Authenticated can read annotations"
  ON public.waste_event_annotations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage annotations"
  ON public.waste_event_annotations FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('BinSight Admin', 'Hospital Admin', 'Hospital Manager'));
