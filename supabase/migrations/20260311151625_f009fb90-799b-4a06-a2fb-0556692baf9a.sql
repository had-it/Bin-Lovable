-- Allow read access to user tables for login (needed by custom auth)
CREATE POLICY "Allow read access for login" ON public.karolinska_university_hospital_users FOR SELECT USING (true);
CREATE POLICY "Allow read access for login" ON public.capio_st_görans_sjukhus_users FOR SELECT USING (true);