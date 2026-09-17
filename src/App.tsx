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
import {
  Field,
  FoundationFields,
  PlanEditor,
  CommitmentEditor,
  Pursuit,
  Proof,
  ProofDetail,
  type Save,
} from "./components/PursuitScreens";
function Privacy() {
  return (
    <footer className="privacy">
      <p className="eyebrow">Private by default</p>
      <p>Your writing and Proof belong to you.</p>
    </footer>
  );
}
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
        ? (draft.words || draft.vision) && canUseDraft(draft, user.id)
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
  function start(_kind: "goal" | "vision") {
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
    const storageKey = `earned-self:${adapter.preview ? "preview" : "account"}:pending:${actorId}:${kind}:${String(payload.goalId ?? payload.id ?? "preferences")}`;
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
        <h1 tabIndex={-1}>Who do you want to become?</h1>
        <p className="intro">
          Choose something that will demand more of you. Give that vision a
          significant accomplishment to work toward.
        </p>
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
                if (!user) {
                  saveDraft(draft);
                  navigate("/auth");
                } else {
                  const d = { ...draft, boundOwner: user.id };
                  saveDraft(d);
                  setDraft(d);
                  void save(
                    "goal",
                    Object.fromEntries(
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
                      ].map((k) => [k, d[k as keyof EntryDraft]]),
                    ),
                    (r) => {
                      clearDraft();
                      setDraft(loadDraft());
                      navigate("/plan/" + r.id);
                    },
                  );
                }
              } catch (e) {
                setError(message(e));
              }
            }}
          >
            <fieldset disabled={saving}>
              <FoundationFields value={draft} change={changeDraft} />
              <p className="muted">
                {draftError ||
                  "Your draft is kept on this device. You choose whether to save it to your account."}
              </p>
              <div className="actions">
                <button className="button" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : user
                      ? "Save pursuit draft"
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
            (draft.words || draft.vision) &&
              (!user || canUseDraft(draft, user.id))
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
          <p role="status">Loading your goal and Proof…</p>
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
  else if (path.startsWith("/plan/") || path.startsWith("/commitment/")) {
    const goal = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    const Editor = path.startsWith("/plan/") ? PlanEditor : CommitmentEditor;
    screen = goal ? (
      <Editor
        key={`${user.id}:${goal.id}:${goal.revision}`}
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
  } else if (path.startsWith("/proof/")) {
    const entry = snapshot.evidence.find((e) => e.id === path.split("/")[2]);
    screen = entry ? (
      <ProofDetail
        key={`${user.id}:${entry.id}:${entry.revision}`}
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
  } else if (path === "/proof")
    screen = <Proof snapshot={snapshot} navigate={navigate} />;
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
              Current pursuit
              <select
                value={selected?.id ?? ""}
                disabled={saving}
                onChange={(e) =>
                  void save("select", { goalId: e.target.value })
                }
              >
                {snapshot.goals.map((g) => (
                  <option value={g.id} key={g.id}>
                    {(g.words || g.vision || "Draft pursuit").slice(0, 65)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {!selected ? (
          <>
            <p className="eyebrow">Your own starting point</p>
            <h1 tabIndex={-1}>Your ambition belongs here.</h1>
            <p className="intro">
              Choose something you want to work toward. Your Proof begins with
              what you actually do.
            </p>
            <button className="button" onClick={() => start("goal")}>
              Start a pursuit
            </button>
            <div className="privacy">
              <h2>Your Proof is empty.</h2>
              <p>No commitments or results have been added.</p>
            </div>
          </>
        ) : (
          <Pursuit
            key={`${user.id}:${selected.id}`}
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
              My pursuit
            </button>
            <button
              disabled={saving}
              aria-current={path === "/proof" ? "page" : undefined}
              onClick={() => navigate("/proof")}
            >
              Proof
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
        {user ? "You are signed in." : "Your pursuit. Your account."}
      </h1>
      {user ? (
        <>
          <p>
            Signed in as {user.email}.{" "}
            {(draft.words || draft.vision) && canUseDraft(draft, user.id)
              ? "Your draft is ready to review. It has not been saved to your account yet."
              : "Open your own saved work."}
          </p>
          <button className="button" onClick={onContinue}>
            {(draft.words || draft.vision) && canUseDraft(draft, user.id)
              ? "Review my draft"
              : "Open my pursuit"}
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
            continue. Your pursuit draft stays here while you sign in.
          </p>
          {!adapter.configured && (
            <p className="notice">
              Account saving is not connected yet. Your draft remains on this
              device.
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
function Unavailable({ navigate }: { navigate: (p: string) => void }) {
  return (
    <main id="main" className="workspace">
      <h1 tabIndex={-1}>This entry is unavailable.</h1>
      <p>Open your own goal or Proof to continue.</p>
      <button className="button" onClick={() => navigate("/app")}>
        Open my pursuit
      </button>
    </main>
  );
}
