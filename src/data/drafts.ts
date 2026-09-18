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
