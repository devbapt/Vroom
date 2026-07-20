-- Fix Supabase security advisor findings (already applied to production).
-- 1. View: stop enforcing creator's RLS bypass
ALTER VIEW public.admin_demandes_certification SET (security_invoker = true);

-- 2. Pin search_path on all flagged functions
ALTER FUNCTION public.update_post_likes_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_post_comments_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_comment_likes_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_conversation_participant(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.approve_certification(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.reject_certification(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_posts_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_follow_counts() SET search_path = public, pg_temp;

-- 3. Certification admin actions: no app-level admin role exists yet,
-- so restrict these to service_role only (not callable by anon/authenticated via RPC)
REVOKE EXECUTE ON FUNCTION public.approve_certification(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_certification(uuid, text) FROM PUBLIC, anon, authenticated;

-- 4. Trigger-only functions: never meant to be called directly via RPC
REVOKE EXECUTE ON FUNCTION public.handle_follow_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_posts_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_comments_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM PUBLIC, anon, authenticated;

-- 5. Public buckets: drop overly broad SELECT policies that allow listing all files.
-- Public bucket objects remain readable via getPublicUrl (not RLS-gated); app never calls storage .list().
DROP POLICY IF EXISTS "Public avatar access 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "garage_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "map_points_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "messages_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "posts_select" ON storage.objects;
