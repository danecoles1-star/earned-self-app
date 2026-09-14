-- New direct-Supabase project only. No legacy application or fictional seed data.
-- Reviewed source artifact; apply to a disposable/development project first.
BEGIN;
CREATE TABLE public.es_goals (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 revision int NOT NULL DEFAULT 1 CHECK(revision>0), version int NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), UNIQUE(owner_id,id)
);
CREATE TABLE public.es_goal_revisions (
 owner_id uuid NOT NULL, goal_id uuid NOT NULL, revision int NOT NULL CHECK(revision>0),
 kind text NOT NULL CHECK(kind IN ('goal','vision')), words text NOT NULL CHECK(length(btrim(words)) BETWEEN 1 AND 10000),
 meaning text CHECK(length(meaning)<=10000), recorded_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
 PRIMARY KEY(owner_id,goal_id,revision), FOREIGN KEY(owner_id,goal_id) REFERENCES public.es_goals(owner_id,id) ON DELETE CASCADE
);
ALTER TABLE public.es_goals ADD CONSTRAINT es_goal_revision_fk FOREIGN KEY(owner_id,id,revision)
 REFERENCES public.es_goal_revisions(owner_id,goal_id,revision) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE public.es_preferences (
 owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, selected_goal_id uuid,
 support_mode text NOT NULL DEFAULT 'guided' CHECK(support_mode IN ('guided','on_request')),
 version int NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
 FOREIGN KEY(owner_id,selected_goal_id) REFERENCES public.es_goals(owner_id,id) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE public.es_commitments (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, goal_id uuid NOT NULL,
 revision int NOT NULL DEFAULT 1 CHECK(revision>0), version int NOT NULL DEFAULT 1 CHECK(version>0),
 state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','reported')),
 created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), UNIQUE(owner_id,goal_id,id),
 FOREIGN KEY(owner_id,goal_id) REFERENCES public.es_goals(owner_id,id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX es_current_commitment ON public.es_commitments(owner_id,goal_id) WHERE state='active';
CREATE INDEX es_commitment_history ON public.es_commitments(owner_id,goal_id,created_at,id);
CREATE TABLE public.es_commitment_revisions (
 owner_id uuid NOT NULL, goal_id uuid NOT NULL, commitment_id uuid NOT NULL, revision int NOT NULL CHECK(revision>0),
 action text NOT NULL CHECK(length(btrim(action)) BETWEEN 1 AND 10000), criterion text NOT NULL CHECK(length(btrim(criterion)) BETWEEN 1 AND 10000),
 mode text NOT NULL CHECK(mode IN ('deliberate','quick')), recorded_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
 PRIMARY KEY(owner_id,goal_id,commitment_id,revision),
 FOREIGN KEY(owner_id,goal_id,commitment_id) REFERENCES public.es_commitments(owner_id,goal_id,id) ON DELETE CASCADE
);
ALTER TABLE public.es_commitments ADD CONSTRAINT es_commitment_revision_fk FOREIGN KEY(owner_id,goal_id,id,revision)
 REFERENCES public.es_commitment_revisions(owner_id,goal_id,commitment_id,revision) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE public.es_schedules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, goal_id uuid NOT NULL, commitment_id uuid NOT NULL, commitment_revision int NOT NULL,
 state text NOT NULL DEFAULT 'current' CHECK(state IN ('current','superseded')),
 local_date date, local_time time without time zone, time_zone text, starts_at timestamptz,
 location text CHECK(length(location)<=10000), created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
 UNIQUE(owner_id,goal_id,commitment_id,commitment_revision,id),
 FOREIGN KEY(owner_id,goal_id,commitment_id,commitment_revision) REFERENCES public.es_commitment_revisions(owner_id,goal_id,commitment_id,revision) ON DELETE CASCADE,
 CHECK(local_date IS NOT NULL OR nullif(btrim(location),'') IS NOT NULL),
 CHECK(local_date IS NULL OR time_zone IS NOT NULL),
 CHECK((local_time IS NULL AND starts_at IS NULL) OR (local_time IS NOT NULL AND local_date IS NOT NULL AND time_zone IS NOT NULL AND starts_at IS NOT NULL))
);
CREATE UNIQUE INDEX es_current_schedule ON public.es_schedules(owner_id,goal_id,commitment_id) WHERE state='current';
CREATE INDEX es_schedule_definition ON public.es_schedules(owner_id,goal_id,commitment_id,commitment_revision);
CREATE TABLE public.es_evidence (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, goal_id uuid NOT NULL, commitment_id uuid NOT NULL, commitment_revision int NOT NULL,
 schedule_id uuid, revision int NOT NULL DEFAULT 1 CHECK(revision>0), version int NOT NULL DEFAULT 1 CHECK(version>0),
 recorded_at timestamptz NOT NULL DEFAULT transaction_timestamp(), UNIQUE(owner_id,goal_id,id), UNIQUE(owner_id,goal_id,commitment_id),
 FOREIGN KEY(owner_id,goal_id,commitment_id,commitment_revision) REFERENCES public.es_commitment_revisions(owner_id,goal_id,commitment_id,revision) ON DELETE CASCADE,
 FOREIGN KEY(owner_id,goal_id,commitment_id,commitment_revision,schedule_id) REFERENCES public.es_schedules(owner_id,goal_id,commitment_id,commitment_revision,id) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX es_record_index ON public.es_evidence(owner_id,goal_id,recorded_at,id);
CREATE INDEX es_evidence_schedule ON public.es_evidence(owner_id,goal_id,commitment_id,commitment_revision,schedule_id);
CREATE TABLE public.es_evidence_revisions (
 owner_id uuid NOT NULL, goal_id uuid NOT NULL, evidence_id uuid NOT NULL, revision int NOT NULL CHECK(revision>0),
 result text NOT NULL CHECK(result IN ('done','partly','did_not_happen')),
 detail text CHECK(length(detail)<=10000), reflection text CHECK(length(reflection)<=10000),
 occurred_on date, recorded_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
 PRIMARY KEY(owner_id,goal_id,evidence_id,revision),
 FOREIGN KEY(owner_id,goal_id,evidence_id) REFERENCES public.es_evidence(owner_id,goal_id,id) ON DELETE CASCADE
);
ALTER TABLE public.es_evidence ADD CONSTRAINT es_evidence_revision_fk FOREIGN KEY(owner_id,goal_id,id,revision)
 REFERENCES public.es_evidence_revisions(owner_id,goal_id,evidence_id,revision) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE public.es_operations (
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, operation_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('goal','commitment','outcome','detail','select','support')),
 salt uuid NOT NULL, signature text NOT NULL, target_id uuid NOT NULL, result_version int NOT NULL,
 committed_at timestamptz NOT NULL DEFAULT transaction_timestamp(), PRIMARY KEY(owner_id,operation_id)
);
-- Salted SHA-256 detects changed retry content; it is not encryption. No private request/response JSON.
-- These receipts remain account-bound and are removed by account deletion.
CREATE FUNCTION public.es_immutable_revision() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Historical definitions and reports cannot be overwritten'; END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['es_goal_revisions','es_commitment_revisions','es_evidence_revisions'] LOOP
 EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.es_immutable_revision()',t||'_immutable',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['es_goals','es_goal_revisions','es_preferences','es_commitments','es_commitment_revisions','es_schedules','es_evidence','es_evidence_revisions','es_operations'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 IF t<>'es_operations' THEN
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()) AND NOT coalesce((SELECT (auth.jwt()->>''is_anonymous'')::boolean),false))',t||'_own_read',t);
 END IF; END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.es_immutable_revision() FROM PUBLIC,anon,authenticated;
COMMIT;
