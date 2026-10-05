import { useEffect, useState, type ReactNode } from "react";
type Clock = { elapsed: number; started: number | null };
export function elapsedTime(clock: Clock, now = Date.now()) {
  return Math.max(
    0,
    clock.elapsed + (clock.started === null ? 0 : now - clock.started),
  );
}
export function pauseTimer(identity: string, pausedAt = Date.now()) {
  const key = `earned-self:timer:${identity}`;
  try {
    const clock = JSON.parse(localStorage.getItem(key) || "null");
    if (
      clock &&
      Number.isFinite(clock.elapsed) &&
      Number.isFinite(clock.started)
    )
      localStorage.setItem(
        key,
        JSON.stringify({
          elapsed: elapsedTime(clock, Math.max(clock.started, pausedAt)),
          started: null,
        }),
      );
  } catch {}
}
export function StepTimer({
  identity,
  children,
}: {
  identity: string;
  children?: ReactNode;
}) {
  const key = `earned-self:timer:${identity}`;
  const read = (): Clock => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      if (
        v &&
        Number.isFinite(v.elapsed) &&
        v.elapsed >= 0 &&
        (v.started === null || Number.isFinite(v.started))
      )
        return v;
    } catch {}
    return { elapsed: 0, started: null };
  };
  const [clock, setClock] = useState<Clock>(read);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  useEffect(() => {
    setClock(read());
    const sync = (e: StorageEvent) => {
      if (e.key === key) setClock(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.floor(elapsedTime(clock, now) / 1000);
  const display = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  const compactDisplay = seconds < 3600 ? display.slice(3) : display;
  const toggle = () => {
    const stamp = Date.now();
    const current = error ? clock : read();
    const next =
      current.started === null
        ? { ...current, started: stamp }
        : { elapsed: elapsedTime(current, stamp), started: null };
    setNow(stamp);
    setClock(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError("");
    } catch {
      setError("Timer cannot be saved on this device. Keep this page open.");
    }
  };
  return (
    <div className="step-timer">
      <div className="timer-face">
        {children}
        <output
          className={seconds >= 3600 ? "timer-hours" : undefined}
          aria-label="Elapsed time"
        >
          {compactDisplay}
        </output>
        <span className="timer-label">Time spent on this step</span>
      </div>
      <p className="timer-help">
        Start the timer while you work. Check in when you finish.
      </p>
      <button className="button" onClick={toggle}>
        {clock.started !== null
          ? "Pause timer"
          : clock.elapsed
            ? "Resume timer"
            : "Start timer"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
