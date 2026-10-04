import { useEffect, useRef, useState } from "react";
import { Page } from "./ui";
import type { Adapter, Snapshot } from "../data/types";
import type { EntryDraft } from "../data/drafts";
import { resumeEntry } from "../data/resumeEntry";
export function ResumeEntry({
  ownerId,
  email,
  onFresh,
  adapter,
  draft,
  onSaved,
  onBack,
}: {
  ownerId: string;
  email: string;
  onFresh: () => void;
  adapter: Adapter;
  draft: EntryDraft;
  onSaved: (s: Snapshot) => void;
  onBack: () => void;
}) {
  const inFlight = useRef(false);
  const started = useRef(false);
  const mounted = useRef(false);
  const [busy, setBusy] = useState(draft.boundOwner !== null);
  const [error, setError] = useState("");
  const run = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const state = await resumeEntry(adapter, draft, ownerId);
      if (mounted.current) onSaved(state);
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error ? e.message : "Your save could not be confirmed.",
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    if (!started.current && draft.boundOwner !== null) {
      started.current = true;
      void run();
    }
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <Page
      dark={false}
      title={
        !draft.boundOwner && !busy && !error
          ? "Save this plan?"
          : busy
            ? "Keeping your progress."
            : "Your draft is safe."
      }
    >
      {!draft.boundOwner && !busy && !error && (
        <section className="account-identity">
          <p>
            Save this plan to <strong>{email}</strong>?
          </p>
          <h2>{draft.words}</h2>
          <p>{draft.vision}</p>
        </section>
      )}
      <p role="status">
        {busy
          ? "Saving your work to your account…"
          : "Your draft stays on this device until the save is confirmed."}
      </p>
      {error && <p role="alert">{error}</p>}
      {!busy && (
        <>
          <button className="button" onClick={() => void run()}>
            {error ? "Retry save" : "Save this plan"}
          </button>
          {!draft.boundOwner && !error && (
            <button className="button secondary" onClick={onFresh}>
              Start fresh
            </button>
          )}
          {!draft.boundOwner && !error && (
            <p className="small">
              Starting fresh keeps this draft on this device for later.
            </p>
          )}
          <button className="quiet" onClick={onBack}>
            Return to my draft
          </button>
        </>
      )}
    </Page>
  );
}
