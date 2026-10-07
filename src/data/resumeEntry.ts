import type { Adapter, Command } from "./types";
import { canUseDraft, loadDraft, saveDraft, type EntryDraft } from "./drafts";
export async function resumeEntry(
  adapter: Adapter,
  draft: EntryDraft,
  expectedOwner?: string,
) {
  const stored = loadDraft();
  if (stored.id !== draft.id || stored.operationId !== draft.operationId)
    throw new Error(
      "Your draft changed in another window. Return to your draft before saving.",
    );
  if (stored.id === draft.id && stored.boundOwner)
    draft = { ...draft, boundOwner: stored.boundOwner };
  const user = await adapter.getUser();
  if (
    !user ||
    (expectedOwner && user.id !== expectedOwner) ||
    !canUseDraft(draft, user.id)
  )
    throw new Error(
      "Sign in with the account that owns this draft. Your draft has been kept.",
    );
  if (!draft.words.trim() || !draft.vision.trim())
    throw new Error("Finish your vision and challenge before saving.");
  const bound = { ...draft, boundOwner: user.id };
  saveDraft(bound);
  const assertOwner = async () => {
    if ((await adapter.getUser())?.id !== user.id)
      throw new Error("Your account changed. Sign in again to continue.");
  };
  const execute = async (
    kind: Command["kind"],
    payload: Command["payload"],
    operationId: string,
  ) => {
    await assertOwner();
    await adapter.execute({ kind, payload, actorId: user.id, operationId });
    await assertOwner();
  };
  let state = await adapter.read();
  await assertOwner();
  if (!state.goals.some((g) => g.id === bound.id)) {
    const payload = Object.fromEntries(
      [
        "id",
        "words",
        "vision",
        "outcome",
        "meaning",
        "constraints",
        "capabilities",
        "unknowns",
        "affirmed",
        "milestones",
      ].map((k) => [k, bound[k as keyof EntryDraft]]),
    );
    if (bound.area) payload.area = bound.area;
    await execute("goal", payload, bound.operationId);
  }
  if (bound.experience?.supportMode && bound.experience.supportOperationId) {
    await execute(
      "support",
      { mode: bound.experience.supportMode },
      bound.experience.supportOperationId,
    );
  }
  state = await adapter.read();
  await assertOwner();
  const first = bound.experience?.first;
  if (
    first?.action.trim() &&
    first.criterion.trim() &&
    !state.commitments.some((c) => c.id === first.id)
  ) {
    await execute(
      "first_move",
      {
        id: first.id,
        goalId: bound.id,
        action: first.action,
        criterion: first.criterion,
        result:
          first.result &&
          first.detail.trim() &&
          (first.result === "done" ||
            (first.prevented.trim() && first.adjustment.trim()))
            ? first.result
            : "",
        detail: first.detail,
        prevented: first.prevented,
        adjustment: first.adjustment,
      },
      first.id,
    );
  }
  state = await adapter.read();
  await assertOwner();
  if (
    !state.goals.some((g) => g.id === bound.id) ||
    (first?.action.trim() &&
      first.criterion.trim() &&
      !state.commitments.some((c) => c.id === first.id))
  )
    throw new Error(
      "Your save could not be confirmed. Your draft is kept. Try again.",
    );
  return state;
}
