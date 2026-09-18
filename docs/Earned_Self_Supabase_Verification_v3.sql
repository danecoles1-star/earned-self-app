-- Read-only installed-schema verification. Run only after the operator verifies
-- the linked development project and applies the four reviewed CLI migrations.
-- Does not connect, activate, create users, seed, or modify application data.
BEGIN READ ONLY;
DO $$
DECLARE t text; f text; versions text[];
BEGIN
 SELECT array_agg(version::text ORDER BY version) INTO versions FROM supabase_migrations.schema_migrations;
 IF versions IS DISTINCT FROM ARRAY['202609130001','202609130002','202609150001','202609180001'] THEN RAISE EXCEPTION 'Unexpected migration history: %',versions; END IF;
 FOREACH t IN ARRAY ARRAY['es_goals','es_goal_revisions','es_preferences','es_commitments','es_commitment_revisions','es_schedules','es_evidence','es_evidence_revisions','es_operations','es_pursuit_events'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t AND c.relrowsecurity AND c.relforcerowsecurity) THEN RAISE EXCEPTION 'RLS not enabled and forced: %',t; END IF;
  IF has_table_privilege('authenticated','public.'||t,'INSERT,UPDATE,DELETE') OR has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'Unexpected browser grants: %',t; END IF;
  IF t='es_operations' THEN
   IF has_table_privilege('authenticated','public.'||t,'SELECT') THEN RAISE EXCEPTION 'Receipts exposed'; END IF;
  ELSE
   IF NOT has_table_privilege('authenticated','public.'||t,'SELECT') OR NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd='SELECT' AND qual LIKE '%auth.uid()%' AND qual LIKE '%is_anonymous%') THEN RAISE EXCEPTION 'Owner read policy missing: %',t; END IF;
  END IF;
 END LOOP;
 FOREACH f IN ARRAY ARRAY['es_command(uuid,uuid,text,jsonb)','es_read_state()'] LOOP
  IF NOT has_function_privilege('authenticated','public.'||f,'EXECUTE') OR has_function_privilege('anon','public.'||f,'EXECUTE') THEN RAISE EXCEPTION 'Wrong RPC grants: %',f; END IF;
 END LOOP;
 FOREACH f IN ARRAY ARRAY['es_instant(jsonb)','es_check_plan(jsonb,boolean)','es_checked_text(jsonb,text,boolean)','es_immutable_revision()'] LOOP
  IF has_function_privilege('authenticated','public.'||f,'EXECUTE') OR has_function_privilege('anon','public.'||f,'EXECUTE') THEN RAISE EXCEPTION 'Helper exposed: %',f; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.es_command(uuid,uuid,text,jsonb)'::regprocedure AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog']) THEN RAISE EXCEPTION 'Unsafe command security'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.es_read_state()'::regprocedure AND prosecdef) THEN RAISE EXCEPTION 'Read must be invoker'; END IF;
 FOREACH t IN ARRAY ARRAY['es_goal_revisions','es_commitment_revisions','es_evidence_revisions','es_pursuit_events'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=('public.'||t)::regclass AND NOT tgisinternal AND tgfoid='public.es_immutable_revision()'::regprocedure AND tgenabled='O') THEN RAISE EXCEPTION 'Immutable history trigger missing: %',t; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='es_goals' AND column_name='status') OR NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='es_commitments' AND column_name='milestone_id') THEN RAISE EXCEPTION 'Structured pursuit columns missing'; END IF;
 IF position('first_move' in pg_get_functiondef('public.es_command(uuid,uuid,text,jsonb)'::regprocedure))=0 THEN RAISE EXCEPTION 'First-move command missing'; END IF;
 RAISE NOTICE 'PASS: installed structured-pursuit schema, grants, RLS and history controls. Real JWT/two-account checks still required.';
END $$;
SELECT 'PASS: installed schema verification completed' AS verification_result;
ROLLBACK;
