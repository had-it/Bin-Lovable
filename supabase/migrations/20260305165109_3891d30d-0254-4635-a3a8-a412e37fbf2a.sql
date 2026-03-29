
-- Create secure views for user tables (exclude password column)
CREATE VIEW public.karolinska_university_hospital_users_view
WITH (security_invoker = on) AS
  SELECT email, name, role, department
  FROM public.karolinska_university_hospital_users;

CREATE VIEW public.capio_st_görans_sjukhus_users_view
WITH (security_invoker = on) AS
  SELECT email, name, role, department
  FROM public.capio_st_görans_sjukhus_users;

-- Create views for other tables (no sensitive columns, but consistent pattern)
CREATE VIEW public.karolinska_university_hospital_bins_view
WITH (security_invoker = on) AS
  SELECT binid, name, department
  FROM public.karolinska_university_hospital_bins;

CREATE VIEW public.capio_st_görans_sjukhus_bins_view
WITH (security_invoker = on) AS
  SELECT binid, name, department
  FROM public.capio_st_görans_sjukhus_bins;

CREATE VIEW public.karolinska_university_hospital_waste_view
WITH (security_invoker = on) AS
  SELECT wasteid, time, volume, expiry_date, binid, drugid
  FROM public.karolinska_university_hospital_waste;

CREATE VIEW public.capio_st_görans_sjukhus_waste_view
WITH (security_invoker = on) AS
  SELECT wasteid, time, volume, expiry_date, binid, drugid
  FROM public.capio_st_görans_sjukhus_waste;

CREATE VIEW public.drugs_view
WITH (security_invoker = on) AS
  SELECT drugid, name, strength, volume, cost
  FROM public.drugs;
