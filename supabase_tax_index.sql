-- Run this in Supabase SQL Editor to fix tax lookup timeout (500 / statement timeout).
-- The REST API uses these columns in the WHERE clause; an index makes the query fast.

CREATE INDEX IF NOT EXISTS idx_tax_lookup
ON public.tax (application, police_registration, province, cities, type);
