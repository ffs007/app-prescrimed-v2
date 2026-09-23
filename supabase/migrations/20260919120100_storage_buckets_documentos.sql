-- PDFs de documentos emitidos (privado; acesso público apenas via edge function public-document-link com URL assinada).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documentos-pdf', 'documentos-pdf', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own document pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own document pdfs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own document pdfs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Bucket usado por usePathologyCustomization (as policies já existem em 20260908140937; o bucket nunca foi versionado).
INSERT INTO storage.buckets (id, name, public)
VALUES ('protocolos-usuario', 'protocolos-usuario', false)
ON CONFLICT (id) DO NOTHING;
