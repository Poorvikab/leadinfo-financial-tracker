

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text,
  action text,
  record_type text,
  amount numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.financial_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  record_type text CHECK (record_type = ANY (ARRAY['income'::text, 'expense'::text])),
  category text,
  amount numeric,
  created_at timestamp with time zone DEFAULT now(),
  tax_line text,
  tax_category text,
  record_subtype text,
  is_credit boolean DEFAULT false,
  metadata jsonb,
  notes text,
  CONSTRAINT financial_records_pkey PRIMARY KEY (id)
);
CREATE TABLE public.retirement_401k_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  contribution_date date NOT NULL,
  employee_contribution numeric DEFAULT 0,
  employer_contribution numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  employee_tax_line text,
  employee_tax_category text,
  employer_tax_line text,
  employer_tax_category text,
  CONSTRAINT retirement_401k_records_pkey PRIMARY KEY (id)
);