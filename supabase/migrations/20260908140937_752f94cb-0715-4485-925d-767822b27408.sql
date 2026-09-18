CREATE POLICY "Users read own protocol files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'protocolos-usuario' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own protocol files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'protocolos-usuario' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own protocol files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'protocolos-usuario' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'protocolos-usuario' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own protocol files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'protocolos-usuario' AND (storage.foldername(name))[1] = auth.uid()::text);