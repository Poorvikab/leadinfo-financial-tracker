ALTER TABLE public.activity_logs
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.financial_records
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.retirement_401k_records
ENABLE ROW LEVEL SECURITY;

---------------------------------------------------
-- ACTIVITY LOGS POLICIES
---------------------------------------------------

CREATE POLICY "allow_read_activity_logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_insert_activity_logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_update_activity_logs"
ON public.activity_logs
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "allow_delete_activity_logs"
ON public.activity_logs
FOR DELETE
TO authenticated
USING (true);

---------------------------------------------------
-- FINANCIAL RECORDS POLICIES
---------------------------------------------------

CREATE POLICY "allow_read_financial_records"
ON public.financial_records
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_insert_financial_records"
ON public.financial_records
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_update_financial_records"
ON public.financial_records
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "allow_delete_financial_records"
ON public.financial_records
FOR DELETE
TO authenticated
USING (true);

---------------------------------------------------
-- RETIREMENT 401K RECORDS POLICIES
---------------------------------------------------

CREATE POLICY "allow_read_retirement_401k_records"
ON public.retirement_401k_records
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_insert_retirement_401k_records"
ON public.retirement_401k_records
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_update_retirement_401k_records"
ON public.retirement_401k_records
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "allow_delete_retirement_401k_records"
ON public.retirement_401k_records
FOR DELETE
TO authenticated
USING (true);