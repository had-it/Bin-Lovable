-- Drop legacy hospital-specific user views first (depend on tables)
DROP VIEW IF EXISTS public.capio_st_görans_sjukhus_users_view;
DROP VIEW IF EXISTS public.karolinska_university_hospital_users_view;

-- Drop legacy hospital-specific user tables
DROP TABLE IF EXISTS public.capio_st_görans_sjukhus_users;
DROP TABLE IF EXISTS public.karolinska_university_hospital_users;