import { emptyFoundation, type Foundation } from "./types";
import type { EntryExperience } from "../experience/Onboarding";
export interface EntryDraft extends Foundation {
  experience?: EntryExperience;
  id: string;
  boundOwner: string | null;
  operationId: string;
}
const key = __LOCAL_PREVIEW__
  ? "earned-self:preview-only:entry-draft:v2"
  : "earned-self:private-test:entry-draft:v2";
export function loadDraft(): EntryDraft {
  try {
    const d = JSON.parse(localStorage.getItem(key) || "null");
    if (
      d &&
      typeof d.words === "string" &&
      typeof d.vision === "string" &&
      typeof d.id === "string" &&
      typeof d.operationId === "string"
    )
      return d;
  } catch {}
  return {
    ...emptyFoundation(),
    id: crypto.randomUUID(),
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

const archivePrefix = key + ":archive:";
export function archiveDraft(draft: EntryDraft) {
  if (draft.words || draft.vision)
    localStorage.setItem(archivePrefix + draft.id, JSON.stringify(draft));
}
export function archivedDrafts(owner: string | null): EntryDraft[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(archivePrefix))
      .flatMap((k) => {
        try {
          const d = JSON.parse(localStorage.getItem(k)!);
          return d &&
            typeof d.id === "string" &&
            typeof d.words === "string" &&
            typeof d.vision === "string" &&
            (d.boundOwner === null || d.boundOwner === owner)
            ? [d as EntryDraft]
            : [];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}
export function restoreDraft(draft: EntryDraft) {
  saveDraft(draft);
  localStorage.removeItem(archivePrefix + draft.id);
}
