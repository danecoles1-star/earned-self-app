-- Private, account-scoped profile photos. No challenge or Proof data changes.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', false, 262144, ARRAY['image/webp','image/png'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 262144, allowed_mime_types = ARRAY['image/webp','image/png'];
CREATE POLICY es_profile_photo_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos' AND name = (SELECT auth.uid())::text || '/avatar.webp');
CREATE POLICY es_profile_photo_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND name = (SELECT auth.uid())::text || '/avatar.webp');
CREATE POLICY es_profile_photo_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos' AND name = (SELECT auth.uid())::text || '/avatar.webp')
WITH CHECK (bucket_id = 'profile-photos' AND name = (SELECT auth.uid())::text || '/avatar.webp');
CREATE POLICY es_profile_photo_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos' AND name = (SELECT auth.uid())::text || '/avatar.webp');
COMMIT;
