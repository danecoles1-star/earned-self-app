export interface EntryDraft {
  id: string;
  words: string;
  kind: "goal" | "vision";
  meaning: string;
  boundOwner: string | null;
  operationId: string;
}
const key = __LOCAL_PREVIEW__
  ? "earned-self:preview-only:entry-draft:v1"
  : "earned-self:private-test:entry-draft:v1";
export function loadDraft(): EntryDraft {
  try {
    const d = JSON.parse(localStorage.getItem(key) || "null");
    if (
      d &&
      typeof d.words === "string" &&
      typeof d.id === "string" &&
      typeof d.operationId === "string" &&
      ["goal", "vision"].includes(d.kind)
    )
      return d;
  } catch {}
  return {
    id: crypto.randomUUID(),
    words: "",
    kind: "goal",
    meaning: "",
    boundOwner: null,
    operationId: crypto.randomUUID(),
  };
}
export function saveDraft(d: EntryDraft) {
  localStorage.setItem(key, JSON.stringify(d));
}
export function clearDraft() {
  localStorage.removeItem(key);
}
export function canUseDraft(d: EntryDraft, owner: string) {
  return d.boundOwner === null || d.boundOwner === owner;
}
