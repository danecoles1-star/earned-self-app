-- Basecamp: save unfinished first steps and append milestones without rewriting prior agreements.
BEGIN;
ALTER TABLE public.es_operations DROP CONSTRAINT es_operations_kind_check;
ALTER TABLE public.es_operations ADD CONSTRAINT es_operations_kind_check CHECK(kind IN ('goal','plan','commitment','reschedule','milestone','milestone_schedule','status','outcome','detail','select','support','first_move','planned_step'));
ALTER TABLE public.es_pursuit_events DROP CONSTRAINT es_pursuit_events_kind_check;
ALTER TABLE public.es_pursuit_events ADD CONSTRAINT es_pursuit_events_kind_check CHECK(kind IN ('reschedule','milestone','status','decision','milestone_schedule','planned_step','milestone_attempt'));
CREATE OR REPLACE FUNCTION public.es_command(p_expected_owner uuid,p_operation uuid,p_kind text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid(); op public.es_operations%ROWTYPE; sig text; salt_value uuid; target uuid; gid uuid; cid uuid;
 c public.es_commitments%ROWTYPE; e public.es_evidence%ROWTYPE; prior public.es_evidence_revisions%ROWTYPE;
 result_version int:=1; schedule_id uuid; day_value date; time_value time; zone_value text; wall timestamp; instant timestamptz;
 g public.es_goals%ROWTYPE; gr public.es_goal_revisions%ROWTYPE; milestone jsonb; plan jsonb; state_value text; decision_value text; reason_value text; prevented_value text; adjustment_value text; allowed text[]; words_value text; action_value text; criterion_value text; location_value text; detail_value text; reflection_value text;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM p_expected_owner OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) THEN RAISE EXCEPTION 'Your account changed. Sign in to the original account before retrying'; END IF;
 IF p_operation IS NULL OR p_kind IS NULL OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' THEN RAISE EXCEPTION 'Invalid save request'; END IF;
 allowed:=CASE p_kind
 WHEN 'planned_step' THEN ARRAY['goalId','id','milestoneId','action','criterion']
 WHEN 'first_move' THEN ARRAY['id','goalId','action','criterion','result','detail','prevented','adjustment']
 WHEN 'goal' THEN ARRAY['id','words','vision','outcome','meaning','constraints','capabilities','unknowns','affirmed','milestones']
 WHEN 'plan' THEN ARRAY['goalId','version','words','vision','outcome','meaning','constraints','capabilities','unknowns','affirmed','milestones']
 WHEN 'milestone' THEN ARRAY['goalId','version','milestoneId','detail','result']
 WHEN 'milestone_schedule' THEN ARRAY['goalId','version','milestoneId','localDate','localTime','timeZone','reason']
 WHEN 'status' THEN ARRAY['goalId','version','status','detail','reflection','next']
 WHEN 'reschedule' THEN ARRAY['goalId','commitmentId','version','action','criterion','localDate','localTime','timeZone','location','reason']
 WHEN 'commitment' THEN ARRAY['id','goalId','milestoneId','plannedStepId','action','criterion','localDate','localTime','timeZone','location','decision','reason']
 WHEN 'outcome' THEN ARRAY['id','goalId','commitmentId','version','result','detail','reflection','occurredOn','prevented','adjustment']
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
  PERFORM public.es_check_plan(p_payload,false);
  INSERT INTO public.es_goals(id,owner_id) VALUES(target,actor);
  INSERT INTO public.es_goal_revisions(owner_id,goal_id,revision,kind,words,meaning,vision,outcome,constraints,capabilities,unknowns,affirmed,milestones)
    VALUES(actor,target,1,'goal',coalesce(p_payload->>'words',''),public.es_checked_text(p_payload,'meaning'),coalesce(p_payload->>'vision',''),coalesce(p_payload->>'outcome',''),coalesce(p_payload->>'constraints',''),coalesce(p_payload->>'capabilities',''),coalesce(p_payload->>'unknowns',''),(p_payload->>'affirmed')::boolean,p_payload->'milestones');
  INSERT INTO public.es_preferences(owner_id,selected_goal_id) VALUES(actor,target)
   ON CONFLICT(owner_id) DO UPDATE SET selected_goal_id=excluded.selected_goal_id,version=public.es_preferences.version+1,updated_at=transaction_timestamp();
 ELSIF p_kind='first_move' THEN
  gid:=(p_payload->>'goalId')::uuid;target:=(p_payload->>'id')::uuid;
  SELECT * INTO g FROM public.es_goals WHERE owner_id=actor AND id=gid FOR UPDATE;
  IF NOT FOUND OR g.status<>'draft' THEN RAISE EXCEPTION 'First move needs your own draft ambition'; END IF;
  IF target IS NULL OR EXISTS(SELECT 1 FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid) THEN RAISE EXCEPTION 'First move already imported or preparation has started'; END IF;
  action_value:=public.es_checked_text(p_payload,'action',true);
  criterion_value:=public.es_checked_text(p_payload,'criterion',true);
  detail_value:=public.es_checked_text(p_payload,'detail',p_payload->>'result'<>'');
  IF p_payload->>'result' IS NULL OR p_payload->>'result' NOT IN ('','done','partly','did_not_happen') THEN RAISE EXCEPTION 'Choose what happened'; END IF;
  prevented_value:=public.es_checked_text(p_payload,'prevented',p_payload->>'result' NOT IN ('','done'));
  adjustment_value:=public.es_checked_text(p_payload,'adjustment',p_payload->>'result' NOT IN ('','done'));
  INSERT INTO public.es_commitments(id,owner_id,goal_id,state) VALUES(target,actor,gid,CASE WHEN p_payload->>'result'='' THEN 'active' ELSE 'reported' END);
  INSERT INTO public.es_commitment_revisions(owner_id,goal_id,commitment_id,revision,action,criterion,mode) VALUES(actor,gid,target,1,action_value,criterion_value,'quick');
  IF p_payload->>'result'<>'' THEN
  INSERT INTO public.es_evidence(id,owner_id,goal_id,commitment_id,commitment_revision) VALUES(target,actor,gid,target,1);
  INSERT INTO public.es_evidence_revisions(owner_id,goal_id,evidence_id,revision,result,detail,prevented,adjustment) VALUES(actor,gid,target,1,p_payload->>'result',detail_value,prevented_value,adjustment_value);
  END IF;
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
  SELECT * INTO g FROM public.es_goals WHERE owner_id=actor AND id=gid FOR UPDATE;
  SELECT * INTO gr FROM public.es_goal_revisions WHERE owner_id=actor AND goal_id=gid AND revision=g.revision;
  SELECT value INTO milestone FROM jsonb_array_elements(gr.milestones) WITH ORDINALITY m(value,position)
   WHERE NOT EXISTS(SELECT 1 FROM public.es_pursuit_events ev WHERE ev.owner_id=actor AND ev.goal_id=gid AND ev.kind='milestone' AND ev.data->>'milestoneId'=value->>'id') ORDER BY position LIMIT 1;
  IF p_kind='planned_step' THEN
   IF g.status NOT IN ('draft','active','paused') OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(gr.milestones) m WHERE m->>'id'=p_payload->>'milestoneId') OR EXISTS(SELECT 1 FROM public.es_pursuit_events WHERE owner_id=actor AND goal_id=gid AND kind='milestone' AND data->>'milestoneId'=p_payload->>'milestoneId') THEN RAISE EXCEPTION 'Choose an unfinished milestone'; END IF;
   target:=(p_payload->>'id')::uuid;
   IF target IS NULL OR EXISTS(SELECT 1 FROM public.es_pursuit_events WHERE owner_id=actor AND data->>'stepId'=target::text) THEN RAISE EXCEPTION 'Step already planned'; END IF;
   action_value:=public.es_checked_text(p_payload,'action',true);criterion_value:=public.es_checked_text(p_payload,'criterion',true);
   INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(actor,gid,'planned_step',jsonb_build_object('stepId',target::text,'milestoneId',p_payload->>'milestoneId','action',action_value,'criterion',criterion_value));
  ELSIF p_kind='plan' THEN
   IF g.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This pursuit changed. Reload before saving'; END IF;
   IF g.status<>'draft' OR EXISTS(SELECT 1 FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND state='active') THEN
    IF g.status NOT IN ('active','paused') OR EXISTS(SELECT 1 FROM unnest(ARRAY['words','vision','outcome','meaning','constraints','capabilities','unknowns','affirmed']) k WHERE p_payload->k IS DISTINCT FROM to_jsonb(gr)->k) THEN RAISE EXCEPTION 'Keep existing agreements unchanged'; END IF;
    IF jsonb_array_length(p_payload->'milestones')<=jsonb_array_length(gr.milestones) OR EXISTS(SELECT 1 FROM jsonb_array_elements(gr.milestones) WITH ORDINALITY x(m,n) WHERE m IS DISTINCT FROM p_payload->'milestones'->(n::int-1)) THEN RAISE EXCEPTION 'Add new milestones at the end'; END IF;
    PERFORM public.es_check_plan(p_payload,true);
   END IF;
   PERFORM public.es_check_plan(p_payload,false);
   INSERT INTO public.es_goal_revisions(owner_id,goal_id,revision,kind,words,meaning,vision,outcome,constraints,capabilities,unknowns,affirmed,milestones)
    VALUES(actor,gid,g.revision+1,'goal',coalesce(p_payload->>'words',''),public.es_checked_text(p_payload,'meaning'),coalesce(p_payload->>'vision',''),coalesce(p_payload->>'outcome',''),coalesce(p_payload->>'constraints',''),coalesce(p_payload->>'capabilities',''),coalesce(p_payload->>'unknowns',''),(p_payload->>'affirmed')::boolean,p_payload->'milestones');
   UPDATE public.es_goals SET revision=revision+1,version=version+1 WHERE owner_id=actor AND id=gid RETURNING version INTO result_version; target:=gid;
  ELSIF p_kind='milestone_schedule' THEN
   IF g.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This pursuit changed. Reload before saving'; END IF;
   IF g.status NOT IN ('active','paused') THEN RAISE EXCEPTION 'Only active or paused preparation can be rescheduled'; END IF;
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(gr.milestones) m WHERE m->>'id'=p_payload->>'milestoneId') OR EXISTS(SELECT 1 FROM public.es_pursuit_events WHERE owner_id=actor AND goal_id=gid AND kind='milestone' AND data->>'milestoneId'=p_payload->>'milestoneId') THEN RAISE EXCEPTION 'Unfinished milestone unavailable'; END IF;
   reason_value:=public.es_checked_text(p_payload,'reason',true); instant:=public.es_instant(p_payload);
   IF EXISTS(SELECT 1 FROM public.es_commitments cmroot JOIN public.es_schedules s ON s.owner_id=cmroot.owner_id AND s.goal_id=cmroot.goal_id AND s.commitment_id=cmroot.id AND s.state='current' WHERE cmroot.owner_id=actor AND cmroot.goal_id=gid AND cmroot.milestone_id=(p_payload->>'milestoneId')::uuid AND cmroot.state='active' AND s.starts_at>instant) THEN RAISE EXCEPTION 'Milestone deadline cannot precede its scheduled action'; END IF;
   SELECT jsonb_agg(CASE WHEN m->>'id'=p_payload->>'milestoneId' THEN m||jsonb_build_object('localDate',p_payload->>'localDate','localTime',p_payload->>'localTime','timeZone',p_payload->>'timeZone') ELSE m END ORDER BY n) INTO plan FROM jsonb_array_elements(gr.milestones) WITH ORDINALITY x(m,n);
   PERFORM public.es_check_plan(to_jsonb(gr)||jsonb_build_object('milestones',plan),true);
   INSERT INTO public.es_goal_revisions(owner_id,goal_id,revision,kind,words,meaning,vision,outcome,constraints,capabilities,unknowns,affirmed,milestones)
    VALUES(actor,gid,g.revision+1,gr.kind,gr.words,gr.meaning,gr.vision,gr.outcome,gr.constraints,gr.capabilities,gr.unknowns,gr.affirmed,plan);
   INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(actor,gid,'milestone_schedule',jsonb_build_object('milestoneId',p_payload->>'milestoneId','detail',reason_value));
   UPDATE public.es_goals SET revision=revision+1,version=version+1 WHERE owner_id=actor AND id=gid RETURNING version INTO result_version; target:=gid;
  ELSIF p_kind IN ('commitment','reschedule') THEN
   IF p_kind='commitment' THEN
    IF g.status NOT IN ('draft','active','paused') THEN RAISE EXCEPTION 'This pursuit has ended. Start a new pursuit for a new direction'; END IF;
    IF EXISTS(SELECT 1 FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND state='active') THEN RAISE EXCEPTION 'Report the current commitment before choosing another'; END IF;
    PERFORM public.es_check_plan(to_jsonb(gr),true);
    IF milestone IS NULL OR milestone->>'id' IS DISTINCT FROM p_payload->>'milestoneId' THEN RAISE EXCEPTION 'Choose the current preparation milestone'; END IF;
    decision_value:=p_payload->>'decision';
    IF coalesce(decision_value,'') NOT IN ('continue','recommit','change_approach','address_blocker') THEN RAISE EXCEPTION 'Choose your next decision'; END IF;
    SELECT r.* INTO prior FROM public.es_evidence evroot JOIN public.es_evidence_revisions r ON r.owner_id=evroot.owner_id AND r.goal_id=evroot.goal_id AND r.evidence_id=evroot.id AND r.revision=evroot.revision WHERE evroot.owner_id=actor AND evroot.goal_id=gid ORDER BY evroot.recorded_at DESC,evroot.id DESC LIMIT 1;
    IF prior.result IS NOT NULL AND prior.result<>'done' AND decision_value='continue' THEN RAISE EXCEPTION 'Choose how you will respond to the earlier result'; END IF;
    reason_value:=public.es_checked_text(p_payload,'reason',decision_value<>'continue');
    IF nullif(p_payload->>'plannedStepId','') IS NOT NULL AND (NOT EXISTS(SELECT 1 FROM public.es_pursuit_events WHERE owner_id=actor AND goal_id=gid AND kind='planned_step' AND data->>'stepId'=p_payload->>'plannedStepId' AND data->>'milestoneId'=p_payload->>'milestoneId') OR EXISTS(SELECT 1 FROM public.es_pursuit_events WHERE owner_id=actor AND goal_id=gid AND kind='decision' AND data->>'plannedStepId'=p_payload->>'plannedStepId')) THEN RAISE EXCEPTION 'Planned step unavailable'; END IF;
    target:=(p_payload->>'id')::uuid;
   ELSE
    SELECT * INTO c FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND id=(p_payload->>'commitmentId')::uuid AND state='active' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Commitment unavailable'; END IF;
    IF c.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This commitment changed. Reload its current version'; END IF;
    IF g.status NOT IN ('active','paused') THEN RAISE EXCEPTION 'Only an active or paused pursuit can be rescheduled'; END IF;
    IF EXISTS(SELECT 1 FROM public.es_schedules WHERE owner_id=actor AND commitment_id=c.id AND state='current' AND starts_at<transaction_timestamp()) THEN RAISE EXCEPTION 'Your commitment needs an update. Report what happened before committing again'; END IF;
    SELECT m INTO milestone FROM jsonb_array_elements(gr.milestones) m WHERE m->>'id'=c.milestone_id::text;
    IF milestone IS NULL THEN RAISE EXCEPTION 'Preparation milestone unavailable'; END IF;
    reason_value:=public.es_checked_text(p_payload,'reason',true);target:=c.id;
   END IF;
   action_value:=public.es_checked_text(p_payload,'action',true);criterion_value:=public.es_checked_text(p_payload,'criterion',true);
   instant:=public.es_instant(p_payload);
   IF instant>public.es_instant(milestone) THEN RAISE EXCEPTION 'Schedule this action on or before its milestone deadline'; END IF;
   day_value:=(p_payload->>'localDate')::date;time_value:=(p_payload->>'localTime')::time;zone_value:=p_payload->>'timeZone';location_value:=public.es_checked_text(p_payload,'location');
   IF p_kind='commitment' THEN
    INSERT INTO public.es_commitments(id,owner_id,goal_id,milestone_id,plan_revision) VALUES(target,actor,gid,(milestone->>'id')::uuid,g.revision);
    INSERT INTO public.es_commitment_revisions(owner_id,goal_id,commitment_id,revision,action,criterion,mode) VALUES(actor,gid,target,1,action_value,criterion_value,'deliberate');
    IF g.status<>'active' THEN INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(actor,gid,'status',jsonb_build_object('from',g.status,'to','active','detail','Preparation and next action scheduled.')); END IF;
    UPDATE public.es_goals SET status='active',version=version+1 WHERE owner_id=actor AND id=gid;
    INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(actor,gid,'decision',jsonb_build_object('plannedStepId',coalesce(p_payload->>'plannedStepId',''),'decision',decision_value,'detail',coalesce(reason_value,''),'commitmentId',target::text));
    c.revision:=1;
   ELSE
    UPDATE public.es_schedules SET state='superseded' WHERE owner_id=actor AND goal_id=gid AND commitment_id=c.id AND state='current';
    INSERT INTO public.es_commitment_revisions(owner_id,goal_id,commitment_id,revision,action,criterion,mode) VALUES(actor,gid,c.id,c.revision+1,action_value,criterion_value,'deliberate');
    UPDATE public.es_commitments SET revision=revision+1,version=version+1 WHERE owner_id=actor AND goal_id=gid AND id=c.id RETURNING revision,version INTO c.revision,result_version;
    INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(actor,gid,'reschedule',jsonb_build_object('commitmentId',c.id::text,'detail',reason_value));
   END IF;
   INSERT INTO public.es_schedules(owner_id,goal_id,commitment_id,commitment_revision,local_date,local_time,time_zone,starts_at,location) VALUES(actor,gid,target,c.revision,day_value,time_value,zone_value,instant,location_value);
  ELSIF p_kind='milestone' THEN
   IF g.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This pursuit changed. Reload before saving'; END IF;
   IF g.status<>'active' OR milestone IS NULL OR milestone->>'id' IS DISTINCT FROM p_payload->>'milestoneId' OR EXISTS(SELECT 1 FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND state='active') THEN RAISE EXCEPTION 'Report current work before completing the current milestone'; END IF;
   detail_value:=public.es_checked_text(p_payload,'detail',true);
   IF coalesce(p_payload->>'result','done') NOT IN ('done','attempted') THEN RAISE EXCEPTION 'Choose a milestone result'; END IF;
   INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(actor,gid,CASE WHEN p_payload->>'result'='attempted' THEN 'milestone_attempt' ELSE 'milestone' END,jsonb_build_object('milestoneId',milestone->>'id','detail',detail_value));
   UPDATE public.es_goals SET version=version+1 WHERE owner_id=actor AND id=gid RETURNING version INTO result_version;target:=gid;
  ELSIF p_kind='status' THEN
   IF g.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This pursuit changed. Reload before saving'; END IF;
   state_value:=p_payload->>'status';
   IF coalesce(state_value,'') NOT IN ('active','paused','changed_direction','completed','abandoned') OR state_value=g.status OR g.status IN ('changed_direction','completed','abandoned') THEN RAISE EXCEPTION 'Choose a valid next state'; END IF;
   detail_value:=public.es_checked_text(p_payload,'detail',true);
   IF state_value='active' THEN
    PERFORM public.es_check_plan(to_jsonb(gr),true);
    IF NOT EXISTS(SELECT 1 FROM public.es_commitments cmroot JOIN public.es_schedules s ON s.owner_id=cmroot.owner_id AND s.goal_id=cmroot.goal_id AND s.commitment_id=cmroot.id AND s.state='current' WHERE cmroot.owner_id=actor AND cmroot.goal_id=gid AND cmroot.state='active' AND cmroot.milestone_id IS NOT NULL AND s.starts_at IS NOT NULL) THEN RAISE EXCEPTION 'Schedule the next action before returning to active'; END IF;
   END IF;
   IF state_value='completed' THEN
    PERFORM public.es_check_plan(to_jsonb(gr),true);
    IF EXISTS(SELECT 1 FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND state='active') THEN RAISE EXCEPTION 'Report outstanding work before completing the major accomplishment'; END IF;
    PERFORM public.es_checked_text(p_payload,'reflection',true);PERFORM public.es_checked_text(p_payload,'next',true);
   END IF;
   INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(actor,gid,'status',jsonb_build_object('from',g.status,'to',state_value,'detail',detail_value,'reflection',coalesce(public.es_checked_text(p_payload,'reflection'),''),'next',coalesce(public.es_checked_text(p_payload,'next'),'')));
   UPDATE public.es_goals SET status=state_value,version=version+1 WHERE owner_id=actor AND id=gid RETURNING version INTO result_version;target:=gid;
  ELSIF p_kind='outcome' THEN
   cid:=(p_payload->>'commitmentId')::uuid;
   SELECT * INTO c FROM public.es_commitments WHERE owner_id=actor AND goal_id=gid AND id=cid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Commitment unavailable'; END IF;
   IF EXISTS(SELECT 1 FROM public.es_evidence WHERE owner_id=actor AND goal_id=gid AND commitment_id=cid) THEN RAISE EXCEPTION 'This commitment already has a result. Open its Proof entry'; END IF;
   IF c.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This commitment changed. Reload its current version'; END IF;
   IF coalesce(p_payload->>'result','') NOT IN ('done','partly','did_not_happen') THEN RAISE EXCEPTION 'Choose what happened'; END IF;
   prevented_value:=public.es_checked_text(p_payload,'prevented',p_payload->>'result'<>'done');adjustment_value:=public.es_checked_text(p_payload,'adjustment',p_payload->>'result'<>'done');
   target:=(p_payload->>'id')::uuid;
   SELECT id INTO schedule_id FROM public.es_schedules WHERE owner_id=actor AND goal_id=gid AND commitment_id=cid AND commitment_revision=c.revision AND state='current';
   day_value:=nullif(p_payload->>'occurredOn','')::date;
   IF day_value>current_date+1 THEN RAISE EXCEPTION 'An outcome cannot occur in the future'; END IF;
   INSERT INTO public.es_evidence(id,owner_id,goal_id,commitment_id,commitment_revision,schedule_id) VALUES(target,actor,gid,cid,c.revision,schedule_id);
   INSERT INTO public.es_evidence_revisions(owner_id,goal_id,evidence_id,revision,result,detail,reflection,occurred_on,prevented,adjustment)
     VALUES(actor,gid,target,1,p_payload->>'result',public.es_checked_text(p_payload,'detail'),public.es_checked_text(p_payload,'reflection'),day_value,prevented_value,adjustment_value);
   UPDATE public.es_commitments SET state='reported',version=version+1 WHERE owner_id=actor AND goal_id=gid AND id=cid;
  ELSIF p_kind='detail' THEN
   target:=(p_payload->>'evidenceId')::uuid;
   SELECT * INTO e FROM public.es_evidence WHERE owner_id=actor AND goal_id=gid AND id=target FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Entry unavailable'; END IF;
   IF e.version IS DISTINCT FROM (p_payload->>'version')::int THEN RAISE EXCEPTION 'This entry changed. Reload before saving'; END IF;
   SELECT * INTO prior FROM public.es_evidence_revisions WHERE owner_id=actor AND goal_id=gid AND evidence_id=target AND revision=e.revision;
   detail_value:=public.es_checked_text(p_payload,'detail');reflection_value:=public.es_checked_text(p_payload,'reflection');
   INSERT INTO public.es_evidence_revisions(owner_id,goal_id,evidence_id,revision,result,detail,reflection,occurred_on,prevented,adjustment)
     VALUES(actor,gid,target,e.revision+1,prior.result,detail_value,reflection_value,prior.occurred_on,prior.prevented,prior.adjustment);
   UPDATE public.es_evidence SET revision=revision+1,version=version+1 WHERE owner_id=actor AND goal_id=gid AND id=target RETURNING version INTO result_version;
  END IF;
 END IF;
 INSERT INTO public.es_operations(owner_id,operation_id,kind,salt,signature,target_id,result_version) VALUES(actor,p_operation,p_kind,salt_value,sig,target,result_version);
 RETURN jsonb_build_object('id',target,'version',result_version);
END $$;

REVOKE ALL ON FUNCTION public.es_command(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.es_command(uuid,uuid,text,jsonb) TO authenticated;
COMMIT;
