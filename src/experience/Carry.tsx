import { displaySchedule, displayDate } from "../data/time";
import { useEffect, useState } from "react";
import type { Goal, Snapshot } from "../data/types";
import { currentAction, currentSchedule, definition } from "../data/domain";
import { Page, Input, Choice, artwork } from "./ui";
import { calendarContent, download, googleCalendarUrl } from "./exports";
import mark from "../assets/mark-transparent.png";
export function Calendar({
  goal,
  snapshot,
  navigate,
}: {
  goal: Goal;
  snapshot: Snapshot;
  navigate: (p: string) => void;
}) {
  const [minutes, setMinutes] = useState(30),
    [notice, setNotice] = useState("");
  const c = currentAction(snapshot, goal.id),
    originalSchedule = c && currentSchedule(snapshot, c.id),
    s =
      originalSchedule && c?.recurrence && c.series_id
        ? { ...originalSchedule, commitment_id: c.series_id }
        : originalSchedule,
    d = c && definition(snapshot, c.id, c.revision);
  return (
    <Page
      title="Make room for it."
      sub="Keep your next step in your calendar."
      dark={false}
      back={() => navigate("/app")}
      footer={
        <button className="button" onClick={() => navigate("/app")}>
          Return to Basecamp
        </button>
      }
    >
      {s?.starts_at && d ? (
        <>
          <h2>{d.action}</h2>
          <p>{displaySchedule(s.local_date, s.local_time, s.time_zone)}</p>
          <label>
            Duration
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              {[5, 10, 15, 30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <a
            className="experience-choice"
            href={googleCalendarUrl(
              d,
              s,
              minutes,
              location.origin,
              c?.recurrence,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Calendar
          </a>
          <button
            className="experience-choice"
            onClick={() => {
              download(
                new Blob(
                  [
                    calendarContent(
                      d,
                      s,
                      minutes,
                      location.origin,
                      c?.recurrence,
                    ),
                  ],
                  {
                    type: "text/calendar;charset=utf-8",
                  },
                ),
                "Earned_Self_Move.ics",
              );
              setNotice(
                "Open the calendar file, review the event, then add it in Calendar.",
              );
            }}
          >
            Apple Calendar
          </button>
          <p className="small">
            Review and confirm in your calendar. If your plan changes, update
            that event too.
          </p>
          {notice && <p role="status">{notice}</p>}
        </>
      ) : (
        <p>Save a scheduled commitment before adding it to your calendar.</p>
      )}
    </Page>
  );
}
export function Wallpaper({
  goal,
  navigate,
}: {
  goal: Goal;
  navigate: (p: string) => void;
}) {
  const [step, setStep] = useState(0),
    [words, setWords] = useState(""),
    [reason, setReason] = useState(false),
    [date, setDate] = useState(false),
    [brand, setBrand] = useState(true),
    [style, setStyle] = useState("mountain"),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  const light = style === "light";
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  useEffect(() => {
    let alive = true;
    let url = "";
    setImageBlob(null);
    setSaved(false);
    async function createPreview() {
      setBusy(true);
      setError("");
      try {
        await document.fonts.ready;
        const canvas = document.createElement("canvas");
        canvas.width = 1170;
        canvas.height = 2532;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = light
          ? "#ece9df"
          : style === "mineral"
            ? "#537889"
            : "#172329";
        ctx.fillRect(0, 0, 1170, 2532);
        if (style === "mountain") {
          const image = new Image();
          image.src = artwork.mountain;
          await image.decode();
          const layer = document.createElement("canvas");
          layer.width = 1170;
          layer.height = 1000;
          const lc = layer.getContext("2d")!;
          const artHeight = (1170 * image.naturalHeight) / image.naturalWidth;
          lc.drawImage(image, 0, (1000 - artHeight) / 2, 1170, artHeight);
          lc.globalCompositeOperation = "destination-in";
          const mask = lc.createLinearGradient(0, 0, 0, 1000);
          mask.addColorStop(0, "transparent");
          mask.addColorStop(0.2, "black");
          mask.addColorStop(0.8, "black");
          mask.addColorStop(1, "transparent");
          lc.fillStyle = mask;
          lc.fillRect(0, 0, 1170, 1000);
          ctx.drawImage(layer, 0, 1250);
        } else {
          // Deterministic fine grain: preview and exported pixels are identical.
          for (let i = 0; i < 22000; i++) {
            const x = (i * 491) % 1170,
              y = (i * 911) % 2532;
            ctx.fillStyle = i % 2 ? "#ffffff08" : "#00000006";
            ctx.fillRect(x, y, 2, 2);
          }
          const glow = ctx.createRadialGradient(200, 1300, 10, 200, 1300, 1600);
          glow.addColorStop(0, "#ffffff18");
          glow.addColorStop(1, "#ffffff00");
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, 1170, 2532);
        }
        ctx.fillStyle = light ? "#172329" : "#f1f3f1";
        ctx.font = "78px Georgia";
        ctx.textAlign = "center";
        let y = 850;
        const lines: string[] = [];
        let line = "";
        for (const word of words.split(/\s+/)) {
          const candidate = (line + " " + word).trim();
          if (ctx.measureText(candidate).width > 970 && line) {
            lines.push(line);
            line = word;
          } else line = candidate;
        }
        if (line) lines.push(line);
        if (
          lines.length > 4 ||
          lines.some((l) => ctx.measureText(l).width > 970)
        )
          throw new Error("Shorten the wording so it fits your lock screen.");
        for (const l of lines) {
          ctx.fillText(l, 585, y);
          y += 100;
        }
        if (reason) {
          ctx.font = "32px Arial";
          const words = goal.meaning.split(/\s+/);
          const lines: string[] = [];
          let line = "";
          for (const w of words) {
            const next = (line + " " + w).trim();
            if (ctx.measureText(next).width > 920) {
              lines.push(line);
              line = w;
            } else line = next;
          }
          if (line) lines.push(line);
          if (
            lines.length > 5 ||
            lines.some((l) => ctx.measureText(l).width > 920)
          )
            throw new Error(
              "Your reason needs more space. Turn it off or shorten your display words.",
            );
          lines.forEach((l, i) => ctx.fillText(l, 585, y + 45 + i * 44));
        }
        if (date) {
          ctx.font = "28px Arial";
          ctx.fillText(
            displayDate(new Date().toLocaleDateString("en-CA")),
            585,
            2220,
          );
        }
        if (brand) {
          const logo = new Image();
          logo.src = mark;
          await logo.decode();
          if (!light) {
            ctx.fillStyle = "#f1f3f1";
            ctx.beginPath();
            ctx.arc(407.5, 2318, 34, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.drawImage(logo, 380, 2290, 55, 56);
          ctx.fillStyle = light ? "#172329" : "#f1f3f1";
          ctx.font = "24px Arial";
          ctx.fillText("E A R N E D   S E L F", 630, 2327);
        }
        const blob = await new Promise<Blob | null>((r) =>
          canvas.toBlob(r, "image/png"),
        );
        if (!blob) throw new Error("Could not create the image. Try again.");
        if (alive) {
          url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setImageBlob(blob);
        }
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
          setPreviewUrl("");
        }
      } finally {
        if (alive) setBusy(false);
      }
    }
    void createPreview();
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [words, reason, date, brand, style, goal.meaning]);
  async function save() {
    if (!imageBlob) return;
    const file = new File([imageBlob], "Earned_Self_Lock_Screen.png", {
      type: "image/png",
    });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: "My Earned Self vision",
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError")
          setError(
            "Sharing is unavailable. Open the full-size image below to save it.",
          );
      }
    } else setSaved(true);
  }
  return (
    <Page
      title={step === 0 ? "Words worth carrying." : "Keep it in sight."}
      sub={
        step === 0
          ? "Choose what belongs on your lock screen."
          : "Preview before you save."
      }
      dark={!light}
      back={() => (step ? setStep(0) : navigate("/app"))}
      footer={
        <>
          {error && <p role="alert">{error}</p>}
          <button
            className="button"
            disabled={!words.trim() || busy || !imageBlob}
            onClick={() => (step ? void save() : setStep(1))}
          >
            {busy
              ? "Creating image…"
              : step
                ? "Save to phone"
                : "Preview lock screen"}
          </button>
          {step === 1 && (
            <button className="quiet" onClick={() => setStep(0)}>
              Edit words
            </button>
          )}
          {previewUrl && step === 1 && (
            <div className="image-save-options">
              <p>On supported phones, choose Save Image in the share sheet.</p>
              <a
                className="button secondary"
                href={previewUrl}
                target="_blank"
                rel="noopener"
              >
                Open full-size image
              </a>
              <button
                className="button secondary"
                onClick={() =>
                  imageBlob &&
                  download(imageBlob, "Earned_Self_Lock_Screen.png")
                }
              >
                Download image
              </button>
              <button className="quiet" onClick={() => navigate("/app")}>
                Return to Basecamp
              </button>
            </div>
          )}
          {saved && (
            <p role="status">
              Open the full-size image, then touch and hold it to see your
              browser’s image-saving options.
            </p>
          )}
        </>
      }
    >
      {step === 0 && (
        <>
          <Input
            label="Words to carry"
            value={words}
            onChange={setWords}
            placeholder="Type here…"
          />
          <button className="quiet" onClick={() => setWords(goal.vision)}>
            Use my own vision
          </button>
          <fieldset className="wallpaper-styles">
            <legend>Choose a style</legend>
            {["mountain", "ink", "mineral", "light"].map((name) => (
              <button
                key={name}
                className={"wallpaper-swatch " + name}
                aria-pressed={style === name}
                onClick={() => setStyle(name)}
              >
                {name === "mountain" && <img src={artwork.mountain} alt="" />}
                <span>{name[0].toUpperCase() + name.slice(1)}</span>
              </button>
            ))}
          </fieldset>
          {[
            ["Add my reason", reason, setReason],
            ["Show date", date, setDate],
            ["Show Earned Self", brand, setBrand],
          ].map(([name, value, set]) => (
            <label className="wallpaper-toggle" key={String(name)}>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) =>
                  (set as (v: boolean) => void)(e.target.checked)
                }
              />
              {String(name)}
            </label>
          ))}
        </>
      )}
      {previewUrl && (
        <img
          className="wallpaper-image"
          src={previewUrl}
          alt="Your lock-screen image preview"
        />
      )}
    </Page>
  );
}
export function Settings({
  snapshot,
  navigate,
  save,
  signOut,
  selectAmbition,
  saving,
}: {
  snapshot: Snapshot;
  navigate: (p: string) => void;
  save: (mode: string) => void;
  signOut: () => void;
  selectAmbition: (id: string) => void;
  saving: boolean;
}) {
  return (
    <Page
      title="Support that fits."
      sub="Choose how Earned Self meets you."
      dark={false}
      back={() => navigate("/app")}
    >
      <Choice
        selected={snapshot.supportMode === "guided"}
        onClick={() => !saving && save("guided")}
      >
        Guide me
      </Choice>
      <p className="small">Relevant prompts appear as you prepare.</p>
      <Choice
        selected={snapshot.supportMode === "on_request"}
        onClick={() => !saving && save("on_request")}
      >
        Help when I ask
      </Choice>
      <p className="small">
        Your own space. Guidance opens when you request it.
      </p>
      <button
        className="experience-choice"
        onClick={() =>
          download(
            new Blob([JSON.stringify(snapshot, null, 2)], {
              type: "application/json",
            }),
            "Earned_Self_My_Data.json",
          )
        }
      >
        Download my data
      </button>
      {snapshot.goals.length > 1 && (
        <label>
          Open an ambition
          <select
            value={snapshot.selectedGoal ?? ""}
            disabled={saving}
            onChange={(e) => selectAmbition(e.target.value)}
          >
            {snapshot.goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.words || g.vision} · {g.status}
              </option>
            ))}
          </select>
        </label>
      )}
      <button className="experience-choice" onClick={() => navigate("/new")}>
        Begin another ambition
      </button>
      <button className="quiet" disabled={saving} onClick={signOut}>
        Sign out
      </button>
    </Page>
  );
}
