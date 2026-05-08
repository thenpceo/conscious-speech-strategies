-- Add invoice number, notes, and submitted date fields
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number integer;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS submitted_date date;

-- Set invoice_number for existing invoices starting at 119
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 118 AS num
  FROM public.invoices
  WHERE invoice_number IS NULL
)
UPDATE public.invoices SET invoice_number = numbered.num
FROM numbered WHERE public.invoices.id = numbered.id;
