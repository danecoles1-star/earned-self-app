import { beforeEach, it, expect, vi } from "vitest";
import { resumeEntry } from "../src/data/resumeEntry";
import { loadDraft, saveDraft } from "../src/data/drafts";
import { newEntryExperience } from "../src/experience/Onboarding";
import {
  emptySnapshot,
  type Adapter,
  type Commitment,
} from "../src/data/types";
beforeEach(() => localStorage.clear());
function setup() {
  const draft = {
    ...loadDraft(),
    words: "Hike Kings Peak",
    vision: "Become resilient",
    experience: newEntryExperience(),
  };
  draft.experience.first.action = "Choose my practice route";
  draft.experience.first.criterion = "One route selected";
  saveDraft(draft);
  const state = emptySnapshot();
  let owner = "a";
  const adapter: Adapter = {
    preview: false,
    configured: true,
    getUser: async () => ({ id: owner }),
    subscribe: () => () => {},
    signIn: async () => {},
    signOut: async () => {},
    read: vi.fn(async () => state),
    execute: vi.fn(async (c) => {
      if (c.kind === "goal")
        state.goals.push({
          ...draft,
          owner_id: owner,
          kind: "goal",
          status: "draft",
          revision: 1,
          version: 1,
          created_at: "now",
        });
      if (c.kind === "first_move")
        state.commitments.push({
          id: String(c.payload.id),
          owner_id: owner,
          goal_id: draft.id,
        } as Commitment);
      return { id: String(c.payload.id), version: 1 };
    }),
  };
  return {
    draft,
    state,
    adapter,
    setOwner: (id: string) => {
      owner = id;
    },
  };
}
it("saves a pending step without inventing Proof and keeps the draft until caller confirms", async () => {
  const { draft, adapter, state } = setup();
  await resumeEntry(adapter, draft);
  expect(state.goals).toHaveLength(1);
  expect(vi.mocked(adapter.execute).mock.calls[1][0].payload.result).toBe("");
  expect(loadDraft().id).toBe(draft.id);
  expect(loadDraft().boundOwner).toBe("a");
  await resumeEntry(adapter, draft);
  expect(adapter.execute).toHaveBeenCalledTimes(2);
});
it("preserves an honestly completed first step", async () => {
  const { draft, adapter } = setup();
  Object.assign(draft.experience.first, {
    result: "done",
    detail: "Selected the ridge trail",
  });
  await resumeEntry(adapter, draft);
  expect(vi.mocked(adapter.execute).mock.calls[1][0].payload).toMatchObject({
    result: "done",
    detail: "Selected the ridge trail",
  });
});
it("does not duplicate a goal after a write succeeds but its response is lost", async () => {
  const { draft, adapter } = setup();
  const original = adapter.execute;
  let failed = false;
  adapter.execute = vi.fn(async (c) => {
    const result = await original(c);
    if (!failed) {
      failed = true;
      throw new Error("Connection lost");
    }
    return result;
  });
  await expect(resumeEntry(adapter, draft)).rejects.toThrow("Connection lost");
  await resumeEntry(adapter, draft);
  expect(
    vi.mocked(adapter.execute).mock.calls.filter(([c]) => c.kind === "goal"),
  ).toHaveLength(1);
});
it("rejects account switching even when retry uses the original unbound in-memory draft", async () => {
  const { draft, adapter, setOwner } = setup();
  vi.mocked(adapter.read).mockRejectedValueOnce(new Error("Read failed"));
  await expect(resumeEntry(adapter, draft)).rejects.toThrow("Read failed");
  setOwner("b");
  await expect(resumeEntry(adapter, draft)).rejects.toThrow("owns this draft");
  expect(adapter.execute).not.toHaveBeenCalled();
  expect(loadDraft().boundOwner).toBe("a");
});

it("does not overwrite a different draft opened in another tab", async () => {
  const { draft, adapter } = setup();
  saveDraft({
    ...loadDraft(),
    id: "different-draft",
    operationId: "different-operation",
    words: "A new challenge",
  });
  await expect(resumeEntry(adapter, draft)).rejects.toThrow("another window");
  expect(loadDraft().words).toBe("A new challenge");
  expect(adapter.execute).not.toHaveBeenCalled();
});
