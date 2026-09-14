import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Homepage } from "./components/Homepage";
import { Brand, Mark } from "./components/Brand";
import {
  emptySnapshot,
  resultLabel,
  type Adapter,
  type Command,
  type Goal,
  type Receipt,
  type Snapshot,
  type User,
  type Result,
} from "./data/types";
import {
  currentAction,
  definition,
  currentReport,
  required,
  validateCommand,
} from "./data/domain";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  canUseDraft,
  type EntryDraft,
} from "./data/drafts";
const message = (e: unknown) =>
  e instanceof Error
    ? e.message
    : "Something did not save. Your input is still here.";
const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
function Field({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  optional?: boolean;
}) {
  const id = label.replace(/\W/g, "");
  return (
    <>
      <label htmlFor={id}>
        {label}
        {optional ? " (optional)" : ""}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={!optional}
      />
    </>
  );
}
function Privacy() {
  return (
    <footer className="privacy">
      <p className="eyebrow">Private by default</p>
      <p>
        You choose what to share. There is no public profile or automatic
        sharing.
      </p>
    </footer>
  );
}
function useTextDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? initial;
    } catch {
      return initial;
    }
  });
  const [error, setError] = useState("");
  const change = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
      setError("");
    } catch {
      setError(
        "This device could not retain your unsaved draft. Keep this page open until you save.",
      );
    }
  };
  return { value, change, error };
}
type Save = (
  kind: Command["kind"],
  payload: Record<string, unknown>,
  after?: (r: Receipt) => void,
) => Promise<void>;
export function App({ adapter }: { adapter: Adapter }) {
  const [path, setPath] = useState(location.pathname),
    [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot),
    [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  const owner = useRef<string | null>(null),
    busy = useRef(false),
    epoch = useRef(0),
    [draft, setDraft] = useState<EntryDraft>(loadDraft),
    [draftError, setDraftError] = useState("");
  const navigate = useCallback((next: string) => {
    history.pushState({}, "", next);
    setPath(next);
    setError("");
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const pop = () => setPath(location.pathname);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    let alive = true,
      observed = false;
    const set = (u: User | null) => {
      if (!alive) return;
      owner.current = u?.id ?? null;
      setUser(u);
      setBoot(false);
    };
    const unsubscribe = adapter.subscribe((u) => {
      observed = true;
      set(u);
    });
    adapter
      .getUser()
      .then((u) => {
        if (!observed) set(u);
      })
      .catch((e) => {
        if (alive) {
          setError(message(e));
          setBoot(false);
        }
      });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [adapter]);
  const refresh = useCallback(async () => {
    const id = owner.current,
      run = ++epoch.current;
    if (!id) return;
    setLoading(true);
    setLoadError("");
    try {
      const state = await adapter.read();
      if (owner.current === id && epoch.current === run) setSnapshot(state);
    } catch (e) {
      if (owner.current === id && epoch.current === run)
        setLoadError(message(e));
    } finally {
      if (owner.current === id && epoch.current === run) setLoading(false);
    }
  }, [adapter]);
  useEffect(() => {
    epoch.current++;
    setSnapshot(emptySnapshot());
    setLoadError("");
    setNotice("");
    if (user) void refresh();
  }, [user?.id, refresh]);
  useEffect(() => {
    if (boot) return;
    if (path === "/auth/callback") {
      const q = new URLSearchParams(location.search),
        h = new URLSearchParams(location.hash.slice(1));
      const failed = q.get("error") || h.get("error");
      const destination = user
        ? draft.words && canUseDraft(draft, user.id)
          ? "/start"
          : "/app"
        : "/auth";
      history.replaceState({}, "", destination);
      setPath(destination);
      if (failed || !user)
        setError(
          "This sign-in link could not be used. Request a new email and open it in the same browser.",
        );
    }
  }, [boot, user, path]);
  useEffect(() => {
    if (!loading && !boot)
      document
        .querySelector<HTMLElement>("main h1")
        ?.focus({ preventScroll: true });
  }, [path, loading, boot]);
  function changeDraft(patch: Partial<EntryDraft>) {
    const d = { ...draft, ...patch, operationId: crypto.randomUUID() };
    setDraft(d);
    try {
      saveDraft(d);
      setDraftError("");
    } catch {
      setDraftError(
        "Your draft could not be saved on this device. Keep this page open.",
      );
    }
  }
  function start(kind: "goal" | "vision") {
    changeDraft({ kind });
    navigate("/start");
  }
  const save: Save = async (kind, payload, after) => {
    if (busy.current) return;
    const actorId = owner.current;
    if (!actorId) {
      setError("Sign in before saving to your account.");
      navigate("/auth");
      return;
    }
    const storageKey = `earned-self:pending:${actorId}:${kind}:${String(payload.goalId ?? payload.id ?? "preferences")}`;
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("Saving…");
    let ack: Receipt | null = null;
    try {
      let c: Command = {
        kind,
        payload,
        actorId,
        operationId: crypto.randomUUID(),
      };
      const pending = localStorage.getItem(storageKey);
      if (pending) {
        const old = JSON.parse(pending) as Command;
        if (
          old.actorId === actorId &&
          JSON.stringify(old.payload) === JSON.stringify(payload) &&
          old.kind === kind
        )
          c = old;
      }
      validateCommand(c);
      localStorage.setItem(storageKey, JSON.stringify(c));
      ack = await adapter.execute(c);
      if (owner.current !== actorId) return;
      localStorage.removeItem(storageKey);
      setNotice(
        __LOCAL_PREVIEW__
          ? "Saved on this device. Preview data only."
          : "Saved to your account.",
      );
      await refresh();
      after?.(ack);
    } catch (e) {
      if (owner.current === actorId) {
        setError(
          ack
            ? "Saved, but this device could not finish updating. Reload your saved work."
            : message(e),
        );
        setNotice(
          ack
            ? "Saved. Reload to continue."
            : "Not saved. Your input is still here.",
        );
      }
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  async function signOut() {
    if (busy.current) return;
    try {
      await adapter.signOut();
      owner.current = null;
      epoch.current++;
      setSnapshot(emptySnapshot());
      setUser(null);
      setNotice("Signed out.");
      navigate("/auth");
    } catch (e) {
      setError(message(e));
    }
  }
  const selected =
    snapshot.goals.find((g) => g.id === snapshot.selectedGoal) ??
    snapshot.goals[0];
  let screen;
  if (path === "/")
    screen = (
      <Homepage
        start={start}
        signIn={() => navigate(user ? "/app" : "/auth")}
        signedIn={!!user}
      />
    );
  else if (boot)
    screen = (
      <main id="main" className="workspace narrow">
        <h1 tabIndex={-1}>Opening your session.</h1>
        <p role="status">Loading…</p>
      </main>
    );
  else if (path === "/start")
    screen = (
      <main id="main" className="workspace narrow">
        <p className="eyebrow">Start with your own words</p>
        <h1 tabIndex={-1}>
          {draft.kind === "vision"
            ? "What do you see for yourself?"
            : "What goal have you been putting off?"}
        </h1>
        <p className="intro">
          Name something that matters to you. You will choose one clear action
          next.
        </p>
        <div className="mode-picker">
          <button
            aria-pressed={draft.kind === "goal"}
            onClick={() => changeDraft({ kind: "goal" })}
          >
            I have a big goal
          </button>
          <button
            aria-pressed={draft.kind === "vision"}
            onClick={() => changeDraft({ kind: "vision" })}
          >
            I have a vision for myself
          </button>
        </div>
        {user && !canUseDraft(draft, user.id) ? (
          <div className="notice">
            <p>
              This draft belongs to a different signed-in account. It has not
              been imported.
            </p>
            <button
              className="secondary"
              onClick={() => {
                clearDraft();
                setDraft(loadDraft());
              }}
            >
              Start a separate draft
            </button>
          </div>
        ) : (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                required(draft.words, "Your goal");
                if (!user) {
                  saveDraft(draft);
                  navigate("/auth");
                } else {
                  const d = { ...draft, boundOwner: user.id };
                  saveDraft(d);
                  setDraft(d);
                  void save(
                    "goal",
                    {
                      id: d.id,
                      words: d.words,
                      kind: d.kind,
                      meaning: d.meaning,
                    },
                    (r) => {
                      clearDraft();
                      setDraft(loadDraft());
                      navigate("/commitment/" + r.id);
                    },
                  );
                }
              } catch (e) {
                setError(message(e));
              }
            }}
          >
            <fieldset disabled={saving}>
              <Field
                label={draft.kind === "vision" ? "Your vision" : "Your goal"}
                value={draft.words}
                onChange={(words) => changeDraft({ words })}
              />
              <Field
                label="Why this matters to you"
                optional
                value={draft.meaning}
                onChange={(meaning) => changeDraft({ meaning })}
              />
              <p className="muted">
                {draftError ||
                  "Your draft is kept on this device. You choose whether to save it to your account."}
              </p>
              <div className="actions">
                <button className="button" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : user
                      ? "Save my goal"
                      : "Keep my draft and continue"}
                </button>
                <button
                  className="text-button"
                  type="button"
                  disabled={saving}
                  onClick={() => navigate(user ? "/app" : "/")}
                >
                  Back
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </main>
    );
  else if (!user || path === "/auth")
    screen = (
      <Auth
        adapter={adapter}
        user={user}
        draft={draft}
        onContinue={() =>
          navigate(
            draft.words && (!user || canUseDraft(draft, user.id))
              ? "/start"
              : "/app",
          )
        }
        onError={setError}
      />
    );
  else if (loading || loadError)
    screen = (
      <main id="main" className="workspace narrow">
        <h1 tabIndex={-1}>
          {loading
            ? "Opening your saved work."
            : "Your work could not be loaded."}
        </h1>
        {loading ? (
          <p role="status">Loading your goal and Record…</p>
        ) : (
          <>
            <p role="alert">{loadError}</p>
            <button className="button" onClick={() => void refresh()}>
              Reload saved work
            </button>
          </>
        )}
      </main>
    );
  else if (path.startsWith("/commitment/")) {
    const goal = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    screen = goal ? (
      <CommitmentEditor
        key={`${user.id}:${goal.id}`}
        user={user}
        goal={goal}
        snapshot={snapshot}
        save={save}
        saving={saving}
        navigate={navigate}
      />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path.startsWith("/entry/")) {
    const entry = snapshot.evidence.find((e) => e.id === path.split("/")[2]);
    screen = entry ? (
      <RecordDetail
        key={`${user.id}:${entry.id}`}
        user={user}
        snapshot={snapshot}
        entryId={entry.id}
        save={save}
        saving={saving}
        navigate={navigate}
      />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path === "/record")
    screen = (
      <main id="main" className="workspace">
        <header>
          <Mark />
          <p className="eyebrow">Your experience, kept together</p>
          <h1 tabIndex={-1}>Your Record.</h1>
          <p className="intro">
            Completed, changed and missed commitments stay here. Open a chapter
            to review what happened.
          </p>
        </header>
        {snapshot.evidence.length === 0 ? (
          <div className="notice">
            <h2>No outcomes recorded yet.</h2>
            <p>
              A saved plan is a beginning. After you take your next step, record
              what happened here.
            </p>
            <button
              className="button"
              disabled={saving}
              onClick={() => navigate("/app")}
            >
              Go to your next step
            </button>
          </div>
        ) : (
          snapshot.goals.map((goal) => (
            <section className="chapter" key={goal.id}>
              <p className="eyebrow">Goal chapter</p>
              <h2>{goal.words}</h2>
              {snapshot.evidence
                .filter((e) => e.goal_id === goal.id)
                .map((e) => {
                  const d = definition(
                      snapshot,
                      e.commitment_id,
                      e.commitment_revision,
                    ),
                    r = currentReport(snapshot, e.id, e.revision);
                  return (
                    <button
                      key={e.id}
                      className="entry-link"
                      disabled={saving}
                      onClick={() => navigate("/entry/" + e.id)}
                    >
                      <span>
                        {r ? resultLabel[r.result] : ""} · Recorded{" "}
                        {date(e.recorded_at)}
                      </span>
                      <strong>{d?.action}</strong>
                      <span>Open this entry →</span>
                    </button>
                  );
                })}
            </section>
          ))
        )}
        <Privacy />
      </main>
    );
  else
    screen = (
      <main id="main" className="workspace">
        <div className="support-row">
          <label>
            Support
            <select
              value={snapshot.supportMode}
              disabled={saving}
              onChange={(e) => void save("support", { mode: e.target.value })}
            >
              <option value="guided">Guided</option>
              <option value="on_request">On request</option>
            </select>
          </label>
          {snapshot.goals.length > 1 && (
            <label>
              Current goal
              <select
                value={selected?.id ?? ""}
                disabled={saving}
                onChange={(e) =>
                  void save("select", { goalId: e.target.value })
                }
              >
                {snapshot.goals.map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.words.slice(0, 65)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {!selected ? (
          <>
            <p className="eyebrow">Your own starting point</p>
            <h1 tabIndex={-1}>Your goal belongs here.</h1>
            <p className="intro">
              Choose something you want to work toward. Your Record begins with
              what you actually do.
            </p>
            <button className="button" onClick={() => start("goal")}>
              Start with a goal
            </button>
            <div className="privacy">
              <h2>Your Record is empty.</h2>
              <p>No commitments or results have been added.</p>
            </div>
          </>
        ) : (
          <Pursuit
            goal={selected}
            snapshot={snapshot}
            save={save}
            saving={saving}
            navigate={navigate}
          />
        )}
        <Privacy />
      </main>
    );
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="test-banner">
        {__LOCAL_PREVIEW__
          ? "LOCAL PREVIEW: browser-only personal entries. Not an account."
          : "Private test · No billing or trial activation."}
        {__LOCAL_PREVIEW__ && (
          <button
            onClick={() => {
              adapter.failNext?.();
              setNotice("The next preview save will fail once.");
            }}
          >
            Test next save failure
          </button>
        )}
      </div>
      {path !== "/" && (
        <header className="app-header">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (!saving) navigate("/");
            }}
          >
            <Brand />
          </a>
          <nav aria-label="Member navigation">
            <button
              disabled={saving}
              aria-current={path === "/app" ? "page" : undefined}
              onClick={() => navigate("/app")}
            >
              My goal
            </button>
            <button
              disabled={saving}
              aria-current={path === "/record" ? "page" : undefined}
              onClick={() => navigate("/record")}
            >
              Record
            </button>
            {user ? (
              <button disabled={saving} onClick={() => void signOut()}>
                Sign out
              </button>
            ) : (
              <button disabled={saving} onClick={() => navigate("/auth")}>
                Sign in
              </button>
            )}
          </nav>
        </header>
      )}
      {path !== "/" && (
        <div className="global-status">
          <p className="live-status" role="status">
            {notice}
          </p>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
      {screen}
    </>
  );
}
function Auth({
  adapter,
  user,
  draft,
  onContinue,
  onError,
}: {
  adapter: Adapter;
  user: User | null;
  draft: EntryDraft;
  onContinue: () => void;
  onError: (e: string) => void;
}) {
  const [email, setEmail] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <main id="main" className="workspace narrow">
      <p className="eyebrow">Keep your work private</p>
      <h1 tabIndex={-1}>
        {user ? "You are signed in." : "Your goal. Your account."}
      </h1>
      {user ? (
        <>
          <p>
            Signed in as {user.email}.{" "}
            {draft.words && canUseDraft(draft, user.id)
              ? "Your draft is ready to review. It has not been saved as a goal yet."
              : "Open your own saved work."}
          </p>
          <button className="button" onClick={onContinue}>
            {draft.words && canUseDraft(draft, user.id)
              ? "Review my draft"
              : "Open my goal"}
          </button>
        </>
      ) : __LOCAL_PREVIEW__ ? (
        <>
          <p>
            This is local preview. No email is sent and no real account is
            created. Personal entries stay in this browser, separate from Maya’s
            example.
          </p>
          <button
            className="button"
            onClick={() =>
              void adapter
                .enterPreview?.()
                .then(onContinue)
                .catch((e) => onError(message(e)))
            }
          >
            Enter local preview
          </button>
        </>
      ) : (
        <>
          <p>
            We will email you a sign-in link. Open it in this browser to
            continue. Your goal draft stays here while you sign in.
          </p>
          {!adapter.configured && (
            <p className="notice">
              Account saving is not connected yet. Codex must configure the
              Supabase development project. Your draft remains on this device.
            </p>
          )}
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              onError("");
              try {
                await adapter.signIn(email);
                setSent(true);
              } catch (e) {
                onError(message(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <div className="actions">
              <button className="button" disabled={busy || !adapter.configured}>
                {busy
                  ? "Sending…"
                  : sent
                    ? "Send another sign-in link"
                    : "Email me a sign-in link"}
              </button>
            </div>
            {sent && (
              <p className="notice success" role="status">
                Check your email. The link signs you in; it does not save or
                import your draft automatically. Wait a minute before requesting
                another.
              </p>
            )}
          </form>
        </>
      )}
      <Privacy />
    </main>
  );
}
function Pursuit({
  goal,
  snapshot,
  save,
  saving,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
}) {
  const c = currentAction(snapshot, goal.id),
    d = c ? definition(snapshot, c.id, c.revision) : null,
    s = c ? snapshot.schedules.find((s) => s.commitment_id === c.id) : null;
  const latest = snapshot.evidence.filter((e) => e.goal_id === goal.id).at(-1),
    r = latest ? currentReport(snapshot, latest.id, latest.revision) : null;
  return (
    <>
      <p className="eyebrow">Your pursuit</p>
      <h1 className="goal-quote" tabIndex={-1}>
        {goal.words}
      </h1>
      {goal.meaning && <p className="intro member-text">{goal.meaning}</p>}
      <div className="pursuit-grid">
        <section className="action-focus">
          <p className="eyebrow">
            {c ? "Your current commitment" : "Your next choice"}
          </p>
          {c && d ? (
            <>
              <h2>{d.action}</h2>
              <p className="eyebrow">Done means</p>
              <p className="member-text">{d.criterion}</p>
              <div className="timing-detail">
                {s?.local_date ? (
                  <p>
                    Planned for {s.local_date}
                    {s.local_time ? " at " + s.local_time.slice(0, 5) : ""}
                    {s.time_zone ? " · " + s.time_zone : ""}.<br />
                    No outcome reported yet.
                  </p>
                ) : (
                  <p>No time set. Your commitment is still yours to act on.</p>
                )}
                {s?.location && <p className="member-text">{s.location}</p>}
              </div>
              <p>Did you take your next step?</p>
              <div className="status-row">
                {(["done", "partly", "did_not_happen"] as Result[]).map(
                  (result) => (
                    <button
                      key={result}
                      className={result === "done" ? "button" : "secondary"}
                      disabled={saving}
                      onClick={() =>
                        void save(
                          "outcome",
                          {
                            id: c.id,
                            goalId: goal.id,
                            commitmentId: c.id,
                            version: c.version,
                            result,
                          },
                          (r) => navigate("/entry/" + r.id),
                        )
                      }
                    >
                      {resultLabel[result]}
                    </button>
                  ),
                )}
              </div>
            </>
          ) : (
            <>
              <h2>
                {r?.result === "did_not_happen"
                  ? "Start from where you are."
                  : "Choose the next action."}
              </h2>
              <p>
                {r
                  ? "Your earlier result stays in your Record. Choose what you will do next."
                  : "Turn your goal into one clear action and decide what will count as done."}
              </p>
              <button
                className="button"
                disabled={saving}
                onClick={() => navigate("/commitment/" + goal.id)}
              >
                {r ? "Make another commitment" : "Choose my first commitment"}
              </button>
            </>
          )}
        </section>
        <aside className="record-aside">
          <p className="eyebrow">Your Record</p>
          {latest && r ? (
            <>
              <h3>{resultLabel[r.result]}</h3>
              <p>
                {
                  definition(
                    snapshot,
                    latest.commitment_id,
                    latest.commitment_revision,
                  )?.action
                }
              </p>
              {r.detail && <p>{r.detail}</p>}
              <button
                className="text-button"
                disabled={saving}
                onClick={() => navigate("/entry/" + latest.id)}
              >
                Open this entry
              </button>
            </>
          ) : (
            <>
              <h3>Your first outcome belongs here.</h3>
              <p>
                No results have been reported. A plan is not a completed action.
              </p>
            </>
          )}
          {snapshot.supportMode === "guided" ? (
            <div className="inline-help">
              <p>
                Keep the action specific enough to know what happened. A
                response from someone else is a separate result.
              </p>
            </div>
          ) : (
            <details className="inline-help">
              <summary>Help with the next step</summary>
              <p>
                Choose an action you can take. Say what counts as done. Timing
                and reflection are optional.
              </p>
            </details>
          )}
        </aside>
      </div>
      <button
        className="text-button"
        disabled={saving}
        onClick={() => navigate("/start")}
      >
        Start another goal
      </button>
    </>
  );
}
function CommitmentEditor({
  user,
  goal,
  snapshot,
  save,
  saving,
  navigate,
}: {
  user: User;
  goal: Goal;
  snapshot: Snapshot;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
}) {
  const key = `earned-self:commitment-draft:${user.id}:${goal.id}`,
    hasHistory = snapshot.commitments.some((c) => c.goal_id === goal.id);
  const {
    value: d,
    change,
    error,
  } = useTextDraft(key, {
    id: crypto.randomUUID(),
    action: "",
    criterion: "",
    mode: hasHistory ? "quick" : "deliberate",
    localDate: "",
    localTime: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: "",
  });
  const [stage, setStage] = useState("edit"),
    [issue, setIssue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      required(d.action, "Action");
      required(d.criterion, "Done criterion");
      if (d.localTime && !d.localDate)
        throw new Error("Choose a date for this time, or leave both open.");
      if (d.mode === "deliberate" && stage === "edit") {
        setStage("confirm");
        return;
      }
      void save("commitment", { ...d, goalId: goal.id }, () => {
        localStorage.removeItem(key);
        navigate("/app");
      });
    } catch (e) {
      setIssue(message(e));
    }
  };
  if (currentAction(snapshot, goal.id))
    return (
      <main id="main" className="workspace narrow">
        <h1 tabIndex={-1}>You have a current commitment.</h1>
        <p>
          Record what happened before making another commitment for this goal.
        </p>
        <button
          className="button"
          disabled={saving}
          onClick={() => navigate("/app")}
        >
          Open current commitment
        </button>
      </main>
    );
  return (
    <main id="main" className="workspace narrow">
      <p className="eyebrow">
        {stage === "confirm" ? "Your commitment" : "Your next commitment"}
      </p>
      <h1 tabIndex={-1}>
        {stage === "confirm"
          ? "I’m choosing this."
          : "Make the next move clear."}
      </h1>
      <p className="intro member-text">{goal.words}</p>
      <form onSubmit={submit}>
        <fieldset disabled={saving}>
          {stage === "edit" ? (
            <>
              <div className="mode-picker">
                <button
                  type="button"
                  aria-pressed={d.mode === "deliberate"}
                  onClick={() => change({ ...d, mode: "deliberate" })}
                >
                  Deliberate
                </button>
                <button
                  type="button"
                  aria-pressed={d.mode === "quick"}
                  onClick={() => change({ ...d, mode: "quick" })}
                >
                  Quick
                </button>
              </div>
              <p className="muted">
                {d.mode === "deliberate"
                  ? "Review the action you are choosing before you save."
                  : "For an ordinary next step. Save the action and what will count as done."}
              </p>
              <Field
                label="Your action"
                value={d.action}
                onChange={(action) => change({ ...d, action })}
              />
              <Field
                label="Done means"
                value={d.criterion}
                onChange={(criterion) => change({ ...d, criterion })}
              />
              <details className="inline-help">
                <summary>Timing and location, optional</summary>
                <div className="fields-row">
                  <div>
                    <label htmlFor="whenDate">Date</label>
                    <input
                      id="whenDate"
                      type="date"
                      value={d.localDate}
                      onChange={(e) =>
                        change({ ...d, localDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="whenTime">Time</label>
                    <input
                      id="whenTime"
                      type="time"
                      value={d.localTime}
                      onChange={(e) =>
                        change({ ...d, localTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <label htmlFor="zone">Time zone</label>
                <input
                  id="zone"
                  value={d.timeZone}
                  onChange={(e) => change({ ...d, timeZone: e.target.value })}
                />
                <label htmlFor="where">Location</label>
                <input
                  id="where"
                  value={d.location}
                  onChange={(e) => change({ ...d, location: e.target.value })}
                />
                <p className="muted">
                  No reminder or calendar event is created.
                </p>
              </details>
            </>
          ) : (
            <div className="intent-panel">
              <p className="eyebrow">I will</p>
              <h2>{d.action}</h2>
              <p className="eyebrow">Done means</p>
              <p className="member-text">{d.criterion}</p>
              <p className="muted">
                {d.localDate
                  ? `Planned for ${d.localDate}${d.localTime ? " at " + d.localTime : ""} · ${d.timeZone}`
                  : "No time set. You can act without setting a date."}
              </p>
            </div>
          )}
          {(issue || error) && (
            <p className="notice error" role="alert">
              {issue || error}
            </p>
          )}
          <div className="actions">
            <button className="button" disabled={saving}>
              {saving
                ? "Saving…"
                : stage === "confirm"
                  ? "Save my commitment"
                  : d.mode === "deliberate"
                    ? "Review my commitment"
                    : "Save this step"}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() =>
                stage === "confirm" ? setStage("edit") : navigate("/app")
              }
            >
              {stage === "confirm" ? "Edit this commitment" : "Back to my goal"}
            </button>
          </div>
        </fieldset>
      </form>
      <Privacy />
    </main>
  );
}
function RecordDetail({
  user,
  snapshot,
  entryId,
  save,
  saving,
  navigate,
}: {
  user: User;
  snapshot: Snapshot;
  entryId: string;
  save: Save;
  saving: boolean;
  navigate: (p: string) => void;
}) {
  const e = snapshot.evidence.find((e) => e.id === entryId)!,
    r = currentReport(snapshot, e.id, e.revision)!,
    goal = snapshot.goals.find((g) => g.id === e.goal_id)!,
    d = definition(snapshot, e.commitment_id, e.commitment_revision)!;
  const [editing, setEditing] = useState(false);
  const key = `earned-self:evidence-draft:${user.id}:${e.id}`;
  const { value, change, error } = useTextDraft(key, {
    detail: r.detail ?? "",
    reflection: r.reflection ?? "",
  });
  return (
    <main id="main" className="workspace record-detail">
      <button
        className="text-button"
        disabled={saving}
        onClick={() => navigate("/record")}
      >
        ← Your Record
      </button>
      <p className="eyebrow">Your reported outcome · {resultLabel[r.result]}</p>
      <h1 tabIndex={-1}>{d.action}</h1>
      <p className="muted">
        Recorded {date(e.recorded_at)}.{" "}
        {r.occurred_on
          ? `Occurred ${r.occurred_on}.`
          : "Occurrence date not specified."}
        {e.revision > 1 ? " Detail updated." : ""}
      </p>
      <section className="record-passage">
        <p className="eyebrow">When I started</p>
        <blockquote>{goal.words}</blockquote>
        {goal.meaning && <p className="member-text">{goal.meaning}</p>}
      </section>
      <section className="record-passage chapter-after">
        <p className="eyebrow">What actually happened</p>
        <h2>{resultLabel[r.result]}</h2>
        <p className="member-text">{d.action}</p>
        <p className="eyebrow">Done means</p>
        <p className="member-text">{d.criterion}</p>
        {r.detail && <p className="member-text">{r.detail}</p>}
      </section>
      <section className="record-passage">
        <p className="eyebrow">What I learned</p>
        {r.reflection ? (
          <p className="member-text">{r.reflection}</p>
        ) : (
          <p>
            No reflection added. You can leave it here or add what the
            experience meant to you.
          </p>
        )}
      </section>
      {editing ? (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            void save(
              "detail",
              {
                goalId: goal.id,
                evidenceId: e.id,
                version: e.version,
                detail: value.detail,
                reflection: value.reflection,
              },
              () => {
                localStorage.removeItem(key);
                setEditing(false);
              },
            );
          }}
        >
          <fieldset disabled={saving}>
            <Field
              label="What happened"
              optional
              value={value.detail}
              onChange={(detail) => change({ ...value, detail })}
            />
            <Field
              label="What I learned"
              optional
              value={value.reflection}
              onChange={(reflection) => change({ ...value, reflection })}
            />
            {error && <p role="alert">{error}</p>}
            <div className="actions">
              <button className="button" disabled={saving}>
                {saving ? "Saving…" : "Save optional detail"}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setEditing(false)}
              >
                Keep this as a draft
              </button>
            </div>
          </fieldset>
        </form>
      ) : (
        <button className="text-button" onClick={() => setEditing(true)}>
          {r.detail || r.reflection
            ? "Edit factual detail or reflection"
            : "Add factual detail or reflection"}
        </button>
      )}
      <div className="actions">
        <button
          className="button"
          disabled={saving}
          onClick={() => navigate("/commitment/" + goal.id)}
        >
          Make another commitment
        </button>
        <button
          className="secondary"
          disabled={saving}
          onClick={() => navigate("/app")}
        >
          Back to my goal
        </button>
      </div>
      <Privacy />
    </main>
  );
}
function Unavailable({ navigate }: { navigate: (p: string) => void }) {
  return (
    <main id="main" className="workspace">
      <h1 tabIndex={-1}>This entry is unavailable.</h1>
      <p>Open your own goal or Record to continue.</p>
      <button className="button" onClick={() => navigate("/app")}>
        Open my goal
      </button>
    </main>
  );
}
