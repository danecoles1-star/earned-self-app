import { useEffect, useRef, useState } from "react";
import { Page } from "./ui";
import type { Adapter, Snapshot } from "../data/types";
import type { EntryDraft } from "../data/drafts";
import { resumeEntry } from "../data/resumeEntry";
export function ResumeEntry({
  adapter,
  draft,
  onSaved,
  onBack,
}: {
  adapter: Adapter;
  draft: EntryDraft;
  onSaved: (s: Snapshot) => void;
  onBack: () => void;
}) {
  const started = useRef(false);
  const mounted = useRef(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const state = await resumeEntry(adapter, draft);
      if (mounted.current) onSaved(state);
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error ? e.message : "Your save could not be confirmed.",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    if (!started.current) {
      started.current = true;
      void run();
    }
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <Page title={busy ? "Keeping your progress." : "Your draft is safe."}>
      <p role="status">
        {busy
          ? "Saving your work to your account…"
          : "Your draft stays on this device until the save is confirmed."}
      </p>
      {error && <p role="alert">{error}</p>}
      {!busy && (
        <>
          <button className="button" onClick={() => void run()}>
            Retry save
          </button>
          <button className="quiet" onClick={onBack}>
            Return to my draft
          </button>
        </>
      )}
    </Page>
  );
}
