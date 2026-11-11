import { useEffect, useRef, useState } from "react";
import type { Adapter, User } from "../data/types";
import { Brand } from "../components/Brand";
import { DraftKept } from "./Notice";
type Mode = "login" | "signup" | "email" | "recovery" | "code" | "password";
type CodeType = "email" | "signup" | "recovery";
const pendingKey = "earned-self:auth-request:v1";
function clearPending() {
  try {
    sessionStorage.removeItem(pendingKey);
  } catch {}
}
function pending() {
  try {
    const value = JSON.parse(sessionStorage.getItem(pendingKey) || "null");
    if (
      value &&
      ["email", "signup", "recovery"].includes(value.type) &&
      typeof value.email === "string" &&
      Date.now() - value.at < 3600000
    )
      return value as {
        email: string;
        type: CodeType;
        at: number;
        verifiedOwner?: string;
      };
  } catch {}
  return null;
}
export function Auth({
  adapter,
  user,
  onContinue,
  initialMode = "login",
  draftWords = "",
}: {
  initialMode?: "login" | "signup";
  /** The unsaved challenge or vision waiting on this device, if any. */
  draftWords?: string;
  adapter: Adapter;
  user: User | null;
  onContinue: () => void;
}) {
  const [initial] = useState(pending);
  const [mode, setMode] = useState<Mode>(
    initial
      ? initial.verifiedOwner && initial.verifiedOwner === user?.id
        ? "password"
        : "code"
      : initialMode,
  );
  const [verifiedOwner, setVerifiedOwner] = useState(
    initial?.verifiedOwner || "",
  );
  const [email, setEmail] = useState(initial?.email || "");
  const [type, setType] = useState<CodeType>(initial?.type || "email");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [until, setUntil] = useState((initial?.at || 0) + 60000);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const wait = Math.max(0, Math.ceil((until - now) / 1000));
  const change = (next: Mode) => {
    if (next !== "code" && next !== "password") clearPending();
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
    setCode("");
  };
  const finish = () => {
    clearPending();
    setPassword("");
    setCode("");
    onContinue();
  };
  const requestSent = (kind: CodeType) => {
    const at = Date.now();
    setType(kind);
    setUntil(at + 60000);
    setMode("code");
    setPassword("");
    setConfirm("");
    setCode("");
    try {
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({ email: email.trim(), type: kind, at }),
      );
    } catch {}
  };
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    const address = email.trim();
    if (mode === "login") {
      await adapter.passwordSignIn!(address, password);
      finish();
    } else if (mode === "signup") {
      await adapter.signUp!(address, password);
      if (await adapter.getUser()) finish();
      else requestSent("signup");
    } else if (mode === "email") {
      await adapter.signIn(address);
      requestSent("email");
    } else if (mode === "recovery") {
      await adapter.recoverPassword!(address);
      requestSent("recovery");
    } else if (mode === "code") {
      await adapter.verifyCode!(address, code.trim(), type);
      if (type === "signup") finish();
      else {
        const verified = await adapter.getUser();
        if (!verified)
          throw new Error("Verification did not finish. Request a new code.");
        setVerifiedOwner(verified.id);
        try {
          sessionStorage.setItem(
            pendingKey,
            JSON.stringify({
              email: address,
              type,
              at: Date.now(),
              verifiedOwner: verified.id,
            }),
          );
        } catch {}
        change("password");
      }
    } else {
      if (!verifiedOwner || (await adapter.getUser())?.id !== verifiedOwner)
        throw new Error("Your session ended. Request a new code to continue.");
      await adapter.updatePassword!(password);
      finish();
    }
  };
  const needsPassword =
    mode === "login" || mode === "signup" || mode === "password";
  const newPassword = mode === "signup" || mode === "password";
  const title =
    mode === "signup"
      ? "Keep what you’ve started."
      : mode === "code"
        ? "Check your email."
        : mode === "password"
          ? "Make returning easy."
          : mode === "recovery"
            ? "Reset your password."
            : "Welcome back.";
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <div id="es-entry" className="eo eo-auth" data-mode={mode}>
      <header className="eo-top">
        <Brand mineral />
      </header>
      <main id="main" className="eo-main">
        <div className="eo-page">
          <h1 ref={heading} tabIndex={-1} className="eo-title">
            {title}
          </h1>
          <p className="eo-sub">
            {mode === "code"
              ? `Use the newest code for ${email.trim()}.`
              : "Your progress stays with you."}
          </p>
          {draftWords.trim() && (mode === "signup" || mode === "login") && (
            <div className="eo-card eo-draft">
              <DraftKept label="Your draft is kept on this device" />
              <p className="eo-draft-words">“{draftWords.trim()}”</p>
              <p className="eo-small">
                {busy
                  ? "Signing you in. Your draft is saved to your account next."
                  : mode === "signup"
                    ? "Create your account and it moves into your Plan and Proof."
                    : "Log in and it moves into your Plan and Proof."}
              </p>
            </div>
          )}
      {__LOCAL_PREVIEW__ ? (
        <>
          <p>Local preview only. No account is created or email sent.</p>
          <button
            className="button"
            onClick={() =>
              void run(async () => {
                await adapter.enterPreview?.();
                onContinue();
              })
            }
          >
            Enter local preview
          </button>
        </>
      ) : (
        <>
          {user && mode === "login" ? (
            <>
              <p>You are signed in as {user.email}.</p>
              <button className="button" onClick={finish}>
                Continue to Now
              </button>
            </>
          ) : (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                void run(submit);
              }}
            >
              {mode === "signup" && (
                <p>
                  Already started an account? Choose Log in below to keep your
                  progress.
                </p>
              )}
              {mode === "email" && (
                <p>
                  Sign in to your existing account with a code. No password
                  needed.
                </p>
              )}
              {mode !== "code" && mode !== "password" && (
                <>
                  <label htmlFor="auth-email">Email address</label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={busy}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </>
              )}
              {mode === "code" && (
                <>
                  <p>
                    {type === "signup"
                      ? "For a new account, look for a confirmation code. Already confirmed this email? Use the sign-in options below; another signup will not send a new confirmation."
                      : type === "recovery"
                        ? "If this email matches an account, you’ll receive a password reset code. Enter it here to choose a new password."
                        : "If this email matches an account, you’ll receive a sign-in code. Enter it here to continue."}
                  </p>
                  <label htmlFor="auth-code">Verification code</label>
                  <input
                    id="auth-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6,10}"
                    minLength={6}
                    maxLength={10}
                    required
                    value={code}
                    disabled={busy}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </>
              )}
              {needsPassword && (
                <>
                  <label htmlFor="auth-password">
                    {newPassword ? "New password" : "Password"}
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={
                      newPassword ? "new-password" : "current-password"
                    }
                    minLength={newPassword ? 12 : undefined}
                    required
                    disabled={busy}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {newPassword && (
                    <>
                      <p className="small">Use at least 12 characters.</p>
                      <label htmlFor="auth-confirm">Confirm password</label>
                      <input
                        id="auth-confirm"
                        type="password"
                        autoComplete="new-password"
                        required
                        disabled={busy}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </>
                  )}
                </>
              )}
              {error && <p role="alert">{error}</p>}
              <button
                className="button"
                disabled={
                  busy ||
                  !adapter.configured ||
                  (newPassword &&
                    (password.length < 12 || password !== confirm))
                }
              >
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Log in"
                    : mode === "signup"
                      ? "Create account"
                      : mode === "code"
                        ? "Verify code"
                        : mode === "password"
                          ? "Save password and continue"
                          : "Send code"}
              </button>
            </form>
          )}
          {!busy && (
            <div className="auth-options">
              {(mode === "signup" ||
                (mode === "code" && type === "signup")) && (
                <>
                  <button className="quiet" onClick={() => change("email")}>
                    Sign in with an email code
                  </button>
                  <button className="quiet" onClick={() => change("login")}>
                    Already have an account? Log in
                  </button>
                </>
              )}
              {mode === "login" && (
                <>
                  <button className="quiet" onClick={() => change("signup")}>
                    Create an account
                  </button>
                  <button className="quiet" onClick={() => change("recovery")}>
                    Forgot password?
                  </button>
                  <button className="quiet" onClick={() => change("email")}>
                    Email me a code
                  </button>
                </>
              )}
              {mode === "code" && (
                <button
                  className="quiet"
                  disabled={wait > 0}
                  onClick={() =>
                    void run(async () => {
                      if (type === "signup")
                        await adapter.resendSignup!(email.trim());
                      else if (type === "recovery")
                        await adapter.recoverPassword!(email.trim());
                      else await adapter.signIn(email.trim());
                      requestSent(type);
                    })
                  }
                >
                  {wait ? `Resend in ${wait}s` : "Resend code"}
                </button>
              )}
              {mode === "password" && type === "email" && (
                <button className="quiet" onClick={finish}>
                  Continue without a password
                </button>
              )}
              {mode !== "login" && (
                <button
                  className="quiet"
                  onClick={() => {
                    clearPending();
                    change("login");
                  }}
                >
                  Back to login
                </button>
              )}
            </div>
          )}
          <p className="small">
            We keep you signed in on this browser. Sign out when using a shared
            device.
          </p>
        </>
      )}
        </div>
      </main>
    </div>
  );
}
