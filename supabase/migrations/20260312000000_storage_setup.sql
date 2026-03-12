-- Create "receipts" bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the bucket for MVP
CREATE POLICY "Public Uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');
