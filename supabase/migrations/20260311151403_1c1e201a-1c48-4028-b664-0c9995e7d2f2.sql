-- Allow anon/authenticated to read drugs table (used by drugs_view)
CREATE POLICY "Allow read access to drugs" ON public.drugs FOR SELECT USING (true);

-- Add test users to Karolinska
INSERT INTO public.karolinska_university_hospital_users (email, password, name, role, department) VALUES
  ('admin@karolinska.se', 'test123', 'Anna Karlsson', 'Hospital Admin', NULL),
  ('manager@karolinska.se', 'test123', 'Erik Lindberg', 'Hospital Manager', NULL),
  ('nurse@karolinska.se', 'test123', 'Sara Nilsson', 'Department User', 'Intensive Care Unit')
ON CONFLICT (email) DO NOTHING;

-- Add test users to Capio
INSERT INTO public.capio_st_görans_sjukhus_users (email, password, name, role, department) VALUES
  ('admin@capio.se', 'test123', 'Maria Svensson', 'Hospital Admin', NULL),
  ('doctor@capio.se', 'test123', 'Johan Berg', 'Department User', 'Emergency Department')
ON CONFLICT (email) DO NOTHING;