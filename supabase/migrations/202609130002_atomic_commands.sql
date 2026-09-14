BEGIN;
CREATE FUNCTION public.es_checked_text(p jsonb,k text,needed boolean DEFAULT false) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE v text;
BEGIN
 IF p ? k AND jsonb_typeof(p->k) NOT IN ('string','null') THEN RAISE EXCEPTION 'Invalid text field'; END IF;
 v:=p->>k;
 IF needed AND (v IS NULL OR length(btrim(v,E' \t\r\n'))=0) THEN RAISE EXCEPTION 'Your action and done criterion must be clear before saving'; END IF;
 IF length(v)>10000 THEN RAISE EXCEPTION 'Text must be 10,000 characters or fewer. It has not been shortened'; END IF;
 RETURN CASE WHEN needed THEN v ELSE nullif(v,'') END;
END $$;
CREATE FUNCTION public.es_command(p_expected_owner uuid,p_operation uuid,p_kind text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid(); op public.es_operations%ROWTYPE; sig text; salt_value uuid; target uuid; gid uuid; cid uuid;
 c public.es_commitments%ROWTYPE; e public.es_evidence%ROWTYPE; prior public.es_evidence_revisions%ROWTYPE;
 result_version int:=1; schedule_id uuid; day_value date; time_value time; zone_value text; wall timestamp; instant timestamptz;
 allowed text[]; words_value text; action_value text; criterion_value text; location_value text; detail_value text; reflection_value text;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM p_expected_owner OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) THEN RAISE EXCEPTION 'Your account changed. Sign in to the original account before retrying'; END IF;
 IF p_operation IS NULL OR p_kind IS NULL OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' THEN RAISE EXCEPTION 'Invalid save request'; END IF;
 allowed:=CASE p_kind
 WHEN 'goal' THEN ARRAY['id','words','kind','meaning']
 WHEN 'commitment' THEN ARRAY['id','goalId','action','criterion','mode','localDate','localTime','timeZone','location']
 WHEN 'outcome' THEN ARRAY['id','goalId','commitmentId','version','result','detail','reflection','occurredOn']
 WHEN 'detail' THEN ARRAY['goalId','evidenceId','version','detail','reflection']
 WHEN 'select' THEN ARRAY['goalId'] WHEN 'support' THEN ARRAY['mode'] ELSE NULL END;
 IF allowed IS NULL OR p_payload-allowed<>'{}'::jsonb THEN RAISE EXCEPTION 'Unsupported save fields'; END IF;
 -- Serialize this member's small command stream; no cross-account lock or last-write-wins race.
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,0));
 SELECT * INTO op FROM public.es_operations WHERE owner_id=actor AND operation_id=p_operation;
 salt_value:=coalesce(op.salt,gen_random_uuid());
 sig:=encode(sha256(convert_to(actor::text||salt_value::text||p_kind||p_payload::text,'UTF8')),'hex');
 IF op.operation_id IS NOT NULL THEN
  IF op.signature<>sig OR op.kind<>p_kind THEN RAISE EXCEPTION 'This save changed. Review it before saving again'; END IF;
  RETURN jsonb_build_object('id',op.target_id,'version',op.result_version);
 END IF;
 IF p_kind='goal' THEN
  target:=(p_payload->>'id')::uuid;IF target IS NULL THEN RAISE EXCEPTION 'Goal identity is required'; END IF;
  words_value:=public.es_checked_text(p_payload,'words',true);
  IF coalesce(p_payload->>'kind','') NOT IN ('goal','vision') THEN RAISE EXCEPTION 'Choose a goal or vision'; END IF;
  INSERT INTO public.es_goals(id,owner_id) VALUES(target,actor);
  INSERT INTO public.es_goal_revisions(owner_id,goal_id,revision,kind,words,meaning)
    VALUES(actor,target,1,p_payload->>'kind',words_value,public.es_checked_text(p_payload,'meaning'));
  INSERT INTO public.es_preferences(owner_id,selected_goal_id) VALUES(actor,target)
   ON CONFLICT(owner_id) DO UPDATE SET selected_goal_id=excluded.selected_goal_id,version=public.es_preferences.version+1,updated_at=transaction_timestamp();
 ELSIF p_kind='support' THEN
  IF coalesce(p_payload->>'mode','') NOT IN ('guided','on_request') THEN RAISE EXCEPTION 'Choose a support mode'; END IF;
  INSERT INTO public.es_preferences(owner_id,support_mode) VALUES(actor,p_payload->>'mode')
   ON CONFLICT(owner_id) DO UPDATE SET support_mode=excluded.support_mode,version=public.es_preferences.version+1,updated_at=transaction_timestamp();
  target:=actor;
 ELSIF p_kind='select' THEN
  target:=(p_payload->>'goalId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.es_goals WHERE owner_id=actor AND id=target) THEN RAISE EXCEPTION 'Goal unavailable'; END IF;
  INSERT INTO public.es_preferences(owner_id,selected_goal_id) VALUES(actor,target)
   ON CONFLICT(owner_id) DO UPDATE SET selected_goal_id=excluded.selected_goal_id,version=public.es_preferences.version+1,updated_at=transaction_timestamp();
 ELSE
  gid:=(p_payload->>'goalId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.es_goals WHERE owner_id=actor AND id=gid) THEN RAISE EXCEPTION 'Goal unavailable'; END IF;
  IF p_kind='commitment' THEN
   IF EXISTS(SELECT 1 FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND state='active') THEN RAISE EXCEPTION 'Record the current commitment before choosing another'; END IF;
   target:=(p_payload->>'id')::uuid;action_value:=public.es_checked_text(p_payload,'action',true);criterion_value:=public.es_checked_text(p_payload,'criterion',true);
   IF coalesce(p_payload->>'mode','') NOT IN ('deliberate','quick') THEN RAISE EXCEPTION 'Choose a commitment mode'; END IF;
   day_value:=nullif(p_payload->>'localDate','')::date;time_value:=nullif(p_payload->>'localTime','')::time;zone_value:=nullif(p_payload->>'timeZone','');
   location_value:=public.es_checked_text(p_payload,'location');
   IF time_value IS NOT NULL AND day_value IS NULL THEN RAISE EXCEPTION 'Choose a date for this time, or leave both open'; END IF;
   IF day_value IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=zone_value) THEN RAISE EXCEPTION 'Choose a valid IANA time zone'; END IF;
   IF time_value IS NOT NULL THEN
    wall:=day_value+time_value;instant:=wall AT TIME ZONE zone_value;
    IF instant AT TIME ZONE zone_value<>wall THEN RAISE EXCEPTION 'This local time does not exist because the clock changes. Choose another time'; END IF;
    IF (instant+interval '1 hour') AT TIME ZONE zone_value=wall OR (instant-interval '1 hour') AT TIME ZONE zone_value=wall
      OR (instant+interval '30 minutes') AT TIME ZONE zone_value=wall OR (instant-interval '30 minutes') AT TIME ZONE zone_value=wall
      THEN RAISE EXCEPTION 'This local time repeats because the clock changes. Choose an unambiguous time'; END IF;
   END IF;
   INSERT INTO public.es_commitments(id,owner_id,goal_id) VALUES(target,actor,gid);
   INSERT INTO public.es_commitment_revisions(owner_id,goal_id,commitment_id,revision,action,criterion,mode)
    VALUES(actor,gid,target,1,action_value,criterion_value,p_payload->>'mode');
   IF day_value IS NOT NULL OR nullif(btrim(location_value),'') IS NOT NULL THEN
    INSERT INTO public.es_schedules(owner_id,goal_id,commitment_id,commitment_revision,local_date,local_time,time_zone,starts_at,location)
      VALUES(actor,gid,target,1,day_value,time_value,CASE WHEN day_value IS NOT NULL THEN zone_value ELSE NULL END,instant,location_value);
   END IF;
  ELSIF p_kind='outcome' THEN
   cid:=(p_payload->>'commitmentId')::uuid;
   SELECT * INTO c FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND id=cid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Commitment unavailable'; END IF;
   IF EXISTS(SELECT 1 FROM public.es_evidence WHERE owner_id=actor AND goal_id=gid AND commitment_id=cid) THEN RAISE EXCEPTION 'This commitment already has a result. Open its Record entry'; END IF;
   IF c.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This commitment changed. Reload its current version'; END IF;
   IF coalesce(p_payload->>'result','') NOT IN ('done','partly','did_not_happen') THEN RAISE EXCEPTION 'Choose what happened'; END IF;
   target:=(p_payload->>'id')::uuid;
   SELECT id INTO schedule_id FROM public.es_schedules WHERE owner_id=actor AND goal_id=gid AND commitment_id=cid AND commitment_revision=c.revision AND state='current';
   day_value:=nullif(p_payload->>'occurredOn','')::date;
   IF day_value>current_date+1 THEN RAISE EXCEPTION 'An outcome cannot occur in the future'; END IF;
   INSERT INTO public.es_evidence(id,owner_id,goal_id,commitment_id,commitment_revision,schedule_id) VALUES(target,actor,gid,cid,c.revision,schedule_id);
   INSERT INTO public.es_evidence_revisions(owner_id,goal_id,evidence_id,revision,result,detail,reflection,occurred_on)
     VALUES(actor,gid,target,1,p_payload->>'result',public.es_checked_text(p_payload,'detail'),public.es_checked_text(p_payload,'reflection'),day_value);
   UPDATE public.es_commitments SET state='reported',version=version+1 WHERE owner_id=actor AND goal_id=gid AND id=cid;
  ELSIF p_kind='detail' THEN
   target:=(p_payload->>'evidenceId')::uuid;
   SELECT * INTO e FROM public.es_evidence WHERE owner_id=actor AND goal_id=gid AND id=target FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Entry unavailable'; END IF;
   IF e.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This entry changed. Reload before saving'; END IF;
   SELECT * INTO prior FROM public.es_evidence_revisions WHERE owner_id=actor AND goal_id=gid AND evidence_id=target AND revision=e.revision;
   detail_value:=public.es_checked_text(p_payload,'detail');reflection_value:=public.es_checked_text(p_payload,'reflection');
   INSERT INTO public.es_evidence_revisions(owner_id,goal_id,evidence_id,revision,result,detail,reflection,occurred_on)
     VALUES(actor,gid,target,e.revision+1,prior.result,detail_value,reflection_value,prior.occurred_on);
   UPDATE public.es_evidence SET revision=revision+1,version=version+1 WHERE owner_id=actor AND goal_id=gid AND id=target RETURNING version INTO result_version;
  END IF;
 END IF;
 INSERT INTO public.es_operations(owner_id,operation_id,kind,salt,signature,target_id,result_version) VALUES(actor,p_operation,p_kind,salt_value,sig,target,result_version);
 RETURN jsonb_build_object('id',target,'version',result_version);
END $$;
CREATE FUNCTION public.es_read_state() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to open your saved work'; END IF;
 SELECT jsonb_build_object(
 'goals',coalesce((SELECT jsonb_agg(jsonb_build_object('id',g.id,'owner_id',g.owner_id,'words',r.words,'kind',r.kind,'meaning',r.meaning,'created_at',g.created_at,'version',g.version) ORDER BY g.created_at,g.id) FROM public.es_goals g JOIN public.es_goal_revisions r ON r.owner_id=g.owner_id AND r.goal_id=g.id AND r.revision=g.revision),'[]'::jsonb),
 'commitments',coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.created_at,c.id) FROM public.es_commitments c),'[]'::jsonb),
 'definitions',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM public.es_commitment_revisions d),'[]'::jsonb),
 'schedules',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.es_schedules s),'[]'::jsonb),
 'evidence',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.recorded_at,e.id) FROM public.es_evidence e),'[]'::jsonb),
 'reports',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM public.es_evidence_revisions r),'[]'::jsonb),
 'selectedGoal',(SELECT selected_goal_id FROM public.es_preferences WHERE owner_id=auth.uid()),
 'supportMode',coalesce((SELECT support_mode FROM public.es_preferences WHERE owner_id=auth.uid()),'guided')
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.es_checked_text(jsonb,text,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.es_command(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.es_read_state() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.es_command(uuid,uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_read_state() TO authenticated;
COMMIT;
