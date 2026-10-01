-- Read-only. Run in the Supabase SQL Editor for vovmkiuxmtnedfosoxds.
-- This selects only the founder's account. It does not change any data.
BEGIN TRANSACTION READ ONLY;
SELECT g.id AS challenge_id, g.created_at, g.status, g.revision,
 r.revision AS saved_revision, r.recorded_at, r.words AS challenge,
 r.vision, r.meaning
FROM public.es_goals g
JOIN auth.users u ON u.id=g.owner_id
JOIN public.es_goal_revisions r ON r.owner_id=g.owner_id AND r.goal_id=g.id
WHERE lower(u.email)='danecoles1@gmail.com'
ORDER BY g.created_at, r.revision;
SELECT g.id AS challenge_id, c.id AS step_id, c.created_at,
 d.action, d.criterion, e.id AS proof_id, e.recorded_at,
 r.result, r.detail
FROM public.es_goals g
JOIN auth.users u ON u.id=g.owner_id
JOIN public.es_commitments c ON c.owner_id=g.owner_id AND c.goal_id=g.id
JOIN public.es_commitment_revisions d ON d.owner_id=c.owner_id AND d.commitment_id=c.id AND d.revision=c.revision
LEFT JOIN public.es_evidence e ON e.owner_id=c.owner_id AND e.commitment_id=c.id
LEFT JOIN public.es_evidence_revisions r ON r.owner_id=e.owner_id AND r.evidence_id=e.id AND r.revision=e.revision
WHERE lower(u.email)='danecoles1@gmail.com'
ORDER BY c.created_at;
ROLLBACK;
