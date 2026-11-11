import { emptyFoundation, type Foundation } from "./types";
import type { EntryExperience } from "../experience/Onboarding";
export interface EntryDraft extends Foundation {
  aiIntake?: import("./aiIntake").AIIntake;
  area?: import("./types").GrowthArea;
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

/** The onboarding answers the plan is built from (time, limits, starting
 * point, interests). They are not part of the saved challenge yet, so a copy
 * stays on this device, keyed by challenge, for the plan service to read. */
const intakePrefix = key + ":intake:";
export function keepIntake(draft: EntryDraft) {
  if (!draft.aiIntake) return;
  try {
    localStorage.setItem(
      intakePrefix + draft.id,
      JSON.stringify({
        owner: draft.boundOwner,
        intent: draft.experience?.entryIntent ?? null,
        intake: draft.aiIntake,
      }),
    );
  } catch {
    /* Storage is full or blocked: the saved challenge is unaffected. */
  }
}
export function keptIntake(goalId: string, owner: string) {
  try {
    const value = JSON.parse(
      localStorage.getItem(intakePrefix + goalId) || "null",
    );
    return value && (value.owner === null || value.owner === owner)
      ? (value.intake as import("./aiIntake").AIIntake)
      : null;
  } catch {
    return null;
  }
}
