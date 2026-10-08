import { AreaContext, AreaTabs, areas, areaLabel } from "./experience/Areas";
import { Stage } from "./experience/Stage";
import type { GrowthArea } from "./data/types";
import { isAppRoute } from "./data/routes";
import { ProfileProvider } from "./experience/ProfilePhoto";
import { Auth } from "./experience/Auth";
import { ResumeEntry } from "./experience/ResumeEntry";
import { PlanStep } from "./experience/PlanStep";
import { AddMilestone } from "./experience/AddMilestone";
import {
  MoveEditor,
  ReportMove,
  MilestoneComplete,
  Decision,
} from "./experience/Actions";
import { Ambition, ProofList, ProofEntry } from "./experience/Ambition";
import { Calendar, Wallpaper, Settings } from "./experience/Carry";
import { Preparation } from "./experience/Preparation";
import { StepTimer } from "./experience/StepTimer";
import { ChallengeRecord } from "./experience/ChallengeRecord";
import { Recovery } from "./experience/Recovery";
import { SupportMode } from "./experience/ui";
import { MemberHome, AppNavigation } from "./experience/MemberHome";
import { Art, Page } from "./experience/ui";
import { Onboarding } from "./experience/Onboarding";
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
  archiveDraft,
  archivedDrafts,
  restoreDraft,
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
  ReportAction,
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
  const [areaView, setAreaView] = useState<GrowthArea | null>(null);
  const [path, setPath] = useState(location.pathname),
    [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot),
    [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    if (
      ![
        "Saved to your account.",
        "Saved on this device. Preview data only.",
      ].includes(notice)
    )
      return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const resumeAfterRead = useRef<{ owner: string; run: () => void } | null>(
    null,
  );
  const owner = useRef<string | null>(null),
    busy = useRef(false),
    epoch = useRef(0),
    [draft, setDraft] = useState<EntryDraft>(loadDraft),
    [draftError, setDraftError] = useState("");
  const navigate = useCallback((next: string) => {
    history.pushState({}, "", next);
    setPath(new URL(next, location.origin).pathname);
    setError("");
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const pop = () => {
      setPath(location.pathname);
      setError("");
      setNotice("");
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    let alive = true,
      observed = false;
    const set = (u: User | null) => {
      if (!alive) return;
      if (owner.current !== (u?.id ?? null)) resumeAfterRead.current = null;
      owner.current = u?.id ?? null;
      setUser(u);
    };
    const unsubscribe = adapter.subscribe((u) => {
      observed = true;
      set(u);
    });
    adapter
      .getUser()
      .then((u) => {
        if (!observed) set(u);
        if (alive) setBoot(false);
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
    if (!id) return false;
    setLoading(true);
    setLoadError("");
    try {
      const state = await adapter.read();
      if (owner.current === id && epoch.current === run) {
        setSnapshot(state);
        return true;
      }
      return false;
    } catch (e) {
      if (owner.current === id && epoch.current === run)
        setLoadError(message(e));
      return false;
    } finally {
      if (owner.current === id && epoch.current === run) setLoading(false);
    }
  }, [adapter]);
  useEffect(() => {
    epoch.current++;
    setSnapshot(emptySnapshot());
    setAreaView(null);
    setLoadError("");
    setNotice("");
    if (user) void refresh();
  }, [user?.id, refresh]);
  useEffect(() => {
    if (boot) return;
    if (path === "/" && user) {
      history.replaceState({}, "", "/app");
      setPath("/app");
    }
    if (path === "/auth/callback") {
      const q = new URLSearchParams(location.search),
        h = new URLSearchParams(location.hash.slice(1));
      const failed = q.get("error") || h.get("error");
      const destination =
        user && !failed
          ? sessionStorage.getItem("earned-self:save-after-auth") ===
              draft.id && canUseDraft(draft, user.id)
            ? "/resume-entry"
            : "/app"
          : "/auth";
      history.replaceState({}, "", destination);
      setPath(destination);
      if (failed || !user)
        setError(
          "This sign-in link could not be used. Log in below or choose Email me a code.",
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
      const refreshed = await refresh();
      if (owner.current !== actorId) return;
      if (!refreshed) {
        resumeAfterRead.current = { owner: actorId, run: () => after?.(ack!) };
        setNotice("Saved. Reload your saved work to continue.");
        return;
      }
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
  const storedSelected =
    snapshot.goals.find((g) => g.id === snapshot.selectedGoal) ??
    snapshot.goals[0];
  const effectiveArea = areaView || storedSelected?.area || null;
  const areaGoals = snapshot.goals.filter((g) => g.area === effectiveArea);
  const selected =
    !areaView || storedSelected?.area === areaView
      ? storedSelected
      : [...areaGoals].sort(
          (a, b) =>
            Number(["draft", "active", "paused"].includes(b.status)) -
              Number(["draft", "active", "paused"].includes(a.status)) ||
            b.created_at.localeCompare(a.created_at),
        )[0];
  const chooseArea = (area: GrowthArea) => {
    setAreaView(area);
    if (!["/app", "/manage", "/proof"].includes(path))
      navigate(path.startsWith("/proof") ? "/proof" : "/app");
    const goal = [...snapshot.goals]
      .filter((g) => g.area === area)
      .sort(
        (a, b) =>
          Number(["draft", "active", "paused"].includes(b.status)) -
            Number(["draft", "active", "paused"].includes(a.status)) ||
          b.created_at.localeCompare(a.created_at),
      )[0];
    if (goal && goal.id !== snapshot.selectedGoal)
      void save("select", { goalId: goal.id });
  };
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
  else if (!isAppRoute(path))
    screen = (
      <Page
        title="This page is not here."
        dark={false}
        footer={
          <button
            className="button"
            onClick={() => navigate(user ? "/app" : "/")}
          >
            {user ? "Return to Now" : "Return to Earned Self"}
          </button>
        }
      >
        <p>Check the address or return to continue.</p>
      </Page>
    );
  else if (path === "/new")
    screen = (
      <Page
        title="Make room for what is next."
        dark={false}
        back={() => navigate("/app")}
        footer={
          <button
            className="button"
            onClick={() => {
              try {
                archiveDraft(draft);
                clearDraft();
                const fresh = {
                  ...loadDraft(),
                  ...(effectiveArea ? { area: effectiveArea } : {}),
                };
                saveDraft(fresh);
                setDraft(fresh);
                setDraftError("");
                navigate("/start");
              } catch {
                setError(
                  "Your earlier draft could not be kept. Please try again.",
                );
              }
            }}
          >
            Begin a fresh challenge
          </button>
        }
      >
        <p>
          Your saved challenges and Proof stay in your account. Start with your
          own words on a blank page.
        </p>
        {(draft.words || draft.vision) && (
          <p>Your unfinished entry draft will be kept on this device.</p>
        )}
        {archivedDrafts(user?.id ?? null).map((earlier) => {
          return (
            <button
              key={earlier.id}
              className="experience-choice"
              onClick={() => {
                try {
                  archiveDraft(draft);
                  restoreDraft(earlier);
                  setDraft(earlier);
                  navigate("/start");
                } catch {
                  setError(
                    "Your earlier draft could not be opened. Please try again.",
                  );
                }
              }}
            >
              Resume earlier draft: {earlier.words || earlier.vision}
            </button>
          );
        })}
      </Page>
    );
  else if (path === "/start")
    screen =
      draft.boundOwner && (!user || !canUseDraft(draft, user.id)) ? (
        <main id="main" className="workspace">
          <h1>Sign in to open your saved draft.</h1>
          <button className="button" onClick={() => navigate("/auth")}>
            Sign in
          </button>
          <button
            className="button"
            onClick={() => {
              navigate("/new");
            }}
          >
            Start a separate draft
          </button>
        </main>
      ) : (
        <Onboarding
          draft={draft}
          change={changeDraft}
          signedIn={!!user}
          saving={saving}
          error={draftError || error}
          back={() => navigate(user ? "/app" : "/")}
          onFinish={() => {
            try {
              saveDraft(draft);
              sessionStorage.setItem("earned-self:save-after-auth", draft.id);
              navigate(user ? "/resume-entry" : "/auth");
            } catch {
              setError(
                "Your draft could not be kept on this device. Keep this page open.",
              );
            }
          }}
        />
      );
  else if (!user || path === "/auth")
    screen = (
      <Auth
        adapter={adapter}
        user={user}
        onContinue={() => {
          void adapter
            .getUser()
            .then((u) => {
              if (!u) {
                setError("Sign-in did not finish. Please try again.");
                return;
              }
              owner.current = u.id;
              setUser(u);
              setError("");
              navigate(
                sessionStorage.getItem("earned-self:save-after-auth") ===
                  draft.id && canUseDraft(draft, u.id)
                  ? "/resume-entry"
                  : "/app",
              );
            })
            .catch((e) => setError(message(e)));
        }}
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
            <button
              className="button"
              onClick={async () => {
                if (await refresh()) {
                  const pending = resumeAfterRead.current;
                  resumeAfterRead.current = null;
                  if (pending?.owner === owner.current) pending.run();
                  setNotice("");
                }
              }}
            >
              Reload saved work
            </button>
          </>
        )}
      </main>
    );
  else if (path === "/resume-entry")
    screen = (
      <ResumeEntry
        key={`${user?.id}:${draft.id}`}
        ownerId={user?.id || ""}
        adapter={adapter}
        draft={draft}
        email={user?.email || ""}
        onFresh={() => {
          const current = loadDraft();
          if (current.id !== draft.id || current.boundOwner) {
            setDraft(current);
            return;
          }
          archiveDraft(current);
          clearDraft();
          setDraft(loadDraft());
          sessionStorage.removeItem("earned-self:save-after-auth");
          navigate("/start");
        }}
        onBack={() => navigate("/start")}
        onSaved={(state) => {
          if (
            !state.goals.some(
              (g) => g.id === draft.id && g.owner_id === owner.current,
            )
          )
            return;
          setSnapshot(state);
          setAreaView(null);
          const currentDraft = loadDraft();
          if (
            currentDraft.id === draft.id &&
            currentDraft.operationId === draft.operationId
          )
            clearDraft();
          sessionStorage.removeItem("earned-self:save-after-auth");
          setDraft(loadDraft());
          setNotice("Saved to your account.");
          navigate("/app");
        }}
      />
    );
  else if (path.startsWith("/import-first/")) {
    const goal = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    const first = draft.experience?.first;
    const finish = () => {
      clearDraft();
      setDraft(loadDraft());
      navigate("/app");
    };
    screen =
      goal && goal.id === draft.id && canUseDraft(draft, user.id) ? (
        <main id="main" className="workspace narrow">
          <h1>Keep your progress.</h1>
          <p>
            {first?.detail || "Your challenge is saved. Open Now to continue."}
          </p>
          <button
            className="button"
            disabled={saving}
            onClick={() => {
              if (
                !first?.action.trim() ||
                !first?.criterion.trim() ||
                snapshot.commitments.some((e) => e.id === first.id)
              ) {
                finish();
                return;
              }
              void save(
                "first_move",
                {
                  id: first.id,
                  goalId: goal.id,
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
                finish,
              );
            }}
          >
            {saving ? "Saving…" : "Save and open Basecamp"}
          </button>
        </main>
      ) : (
        <Unavailable navigate={navigate} />
      );
  } else if (path.startsWith("/add-step/")) {
    const goal = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    screen = goal ? (
      <PlanStep
        goal={goal}
        snapshot={snapshot}
        save={save}
        saving={saving}
        navigate={navigate}
      />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path.startsWith("/add-milestone/")) {
    const goal = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    screen = goal ? (
      <AddMilestone
        goal={goal}
        save={save}
        saving={saving}
        navigate={navigate}
      />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (
    path.startsWith("/plan/") ||
    path.startsWith("/commitment/") ||
    path.startsWith("/revise/")
  ) {
    const goal = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    const Editor = path.startsWith("/plan/") ? Preparation : MoveEditor;
    screen = goal ? (
      <Editor
        key={`${user.id}:${goal.id}:${goal.revision}:${path}`}
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
  } else if (path.startsWith("/proof/challenge/")) {
    const goal = snapshot.goals.find(
      (g) => g.id === path.split("/")[3] && g.status === "completed",
    );
    screen = goal ? (
      <ChallengeRecord goal={goal} snapshot={snapshot} navigate={navigate} />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path.startsWith("/recovery/")) {
    const entry = snapshot.evidence.find((e) => e.id === path.split("/")[2]);
    screen = entry ? (
      <Recovery snapshot={snapshot} id={entry.id} navigate={navigate} />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path.startsWith("/proof/")) {
    const entry = snapshot.evidence.find((e) => e.id === path.split("/")[2]);
    screen = entry ? (
      <ProofEntry
        key={`${user.id}:${entry.id}:${entry.revision}`}
        snapshot={snapshot}
        id={entry.id}
        save={save}
        saving={saving}
        navigate={navigate}
      />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path === "/proof")
    screen = (
      <ProofList
        snapshot={
          effectiveArea
            ? {
                ...snapshot,
                goals: snapshot.goals.filter((g) => g.area === effectiveArea),
                selectedGoal: selected?.id || null,
              }
            : snapshot
        }
        navigate={navigate}
      />
    );
  else if (["/app", "/manage"].includes(path) && !selected)
    screen = (
      <Stage title="Your next challenge" navigate={navigate}>
        <section className="area-empty">
          <p className="section-label">
            {effectiveArea
              ? areaLabel(effectiveArea)
              : "Your own starting point"}
          </p>
          <h2>What could you become here?</h2>
          <p>
            Start one meaningful challenge. Your work in other areas stays
            available.
          </p>
          <button
            className="button"
            onClick={() => navigate(snapshot.goals.length ? "/new" : "/start")}
          >
            Create a challenge
          </button>
        </section>
      </Stage>
    );
  else if (path.startsWith("/manage") && selected)
    screen = (
      <Ambition
        save={save}
        saving={saving}
        key={path}
        goal={selected}
        snapshot={snapshot}
        navigate={navigate}
      />
    );
  else if (
    path.startsWith("/milestone/") ||
    path.startsWith("/decision/") ||
    path.startsWith("/resume/")
  ) {
    const g = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    const Component = path.startsWith("/milestone/")
      ? MilestoneComplete
      : Decision;
    screen = g ? (
      <Component
        key={`${path}:${g.id}`}
        goal={g}
        snapshot={snapshot}
        save={save}
        saving={saving}
        navigate={navigate}
      />
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path.startsWith("/milestone-done/"))
    screen = (
      <Page
        title="You reached a turning point."
        sub="Take a moment to recognize the work."
        footer={
          <button className="button" onClick={() => navigate("/app")}>
            See what comes next
          </button>
        }
      >
        <Art kind="path" />
      </Page>
    );
  else if (path === "/settings")
    screen = (
      <Settings
        email={user?.email || ""}
        snapshot={snapshot}
        navigate={navigate}
        save={(mode) => void save("support", { mode })}
        selectAmbition={(goalId) => {
          setAreaView(null);
          void save("select", { goalId }, () => navigate("/app"));
        }}
        signOut={() => void signOut()}
        saving={saving}
      />
    );
  else if (path.startsWith("/calendar/") || path.startsWith("/wallpaper/")) {
    const g = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    screen = g ? (
      path.startsWith("/calendar/") ? (
        <Calendar goal={g} snapshot={snapshot} navigate={navigate} />
      ) : (
        <Wallpaper goal={g} snapshot={snapshot} navigate={navigate} />
      )
    ) : (
      <Unavailable navigate={navigate} />
    );
  } else if (path === "/app" && selected)
    screen = (
      <MemberHome goal={selected} snapshot={snapshot} navigate={navigate} />
    );
  else if (path.startsWith("/focus/")) {
    const g = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    const c = g && currentAction(snapshot, g.id);
    const d = c && definition(snapshot, c.id, c.revision);
    screen =
      g && c && d ? (
        <Page
          title="This is your move."
          sub="One commitment. Your full attention."
          back={() => navigate("/app")}
          footer={
            <>
              <button
                className="button"
                onClick={() => navigate("/report/" + g.id)}
              >
                Report what happened
              </button>
              <button
                className="quiet"
                onClick={() => navigate("/commitment/" + g.id)}
              >
                Something got in the way
              </button>
            </>
          }
        >
          <h2>{d.action}</h2>
          <p>Done means: {d.criterion}</p>
          <StepTimer
            key={c.id}
            identity={`${g.owner_id}:${c.id}:${c.revision}`}
          />
        </Page>
      ) : (
        <Unavailable navigate={navigate} />
      );
  } else if (path.startsWith("/report/")) {
    const g = snapshot.goals.find((g) => g.id === path.split("/")[2]);
    screen =
      g && currentAction(snapshot, g.id) ? (
        <ReportMove
          goal={g}
          snapshot={snapshot}
          save={save}
          saving={saving}
          navigate={navigate}
        />
      ) : (
        <Unavailable navigate={navigate} />
      );
  } else
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
            <h1 tabIndex={-1}>Your challenge belongs here.</h1>
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
      {__LOCAL_PREVIEW__ && (
        <div className="test-banner">
          {__LOCAL_PREVIEW__
            ? "Local preview · saved on this device"
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
      )}
      {path === "/history" && (
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
            <button disabled={saving} onClick={() => navigate("/app")}>
              My pursuit
            </button>
            <button disabled={saving} onClick={() => navigate("/proof")}>
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
      {path !== "/" && path !== "/start" && (
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
      <div inert={saving} aria-busy={saving}>
        <ProfileProvider
          key={user?.id || "guest"}
          adapter={adapter}
          owner={user?.id || null}
        >
          <AreaContext.Provider
            value={{
              area: path === "/start" ? draft.area || null : effectiveArea,
              choose: chooseArea,
              goals: snapshot.goals,
              busy: saving,
              assignment: user &&
                selected &&
                !selected.area &&
                ["/app", "/manage", "/proof"].includes(path) && (
                  <section className="assign-area">
                    <h2>Choose this challenge’s area</h2>
                    <p>Your existing words and Proof stay unchanged.</p>
                    {areas.map((a) => (
                      <button
                        className="button secondary"
                        key={a}
                        onClick={() =>
                          void save(
                            "area",
                            {
                              goalId: selected.id,
                              version: selected.version,
                              area: a,
                            },
                            () => setAreaView(a),
                          )
                        }
                      >
                        {areaLabel(a)}
                      </button>
                    ))}
                  </section>
                ),
            }}
          >
            <SupportMode.Provider value={snapshot.supportMode}>
              {screen}
            </SupportMode.Provider>
          </AreaContext.Provider>
        </ProfileProvider>
        {user &&
          ![
            "/",
            "/start",
            "/auth",
            "/auth/callback",
            "/new",
            "/resume-entry",
          ].includes(path) && <AppNavigation path={path} navigate={navigate} />}
      </div>
    </>
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
