
CREATE TABLE public.waste_event_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wasteid TEXT NOT NULL,
  hospital_id TEXT NOT NULL,
  note TEXT,
  flag TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wasteid, hospital_id)
);

ALTER TABLE public.waste_event_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to annotations"
  ON public.waste_event_annotations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
