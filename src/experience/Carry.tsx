import { wallpaperColors } from "./wallpapers";
import { completedEvent } from "./ChallengeRecord";
import { ProfilePhotoEditor } from "./ProfilePhoto";
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
      className="calendar-page"
      title="Make room for it."
      sub="Keep your next step in your calendar."
      dark={false}
      back={() => navigate("/app")}
      footer={
        <button className="button" onClick={() => navigate("/app")}>
          Return to Now
        </button>
      }
    >
      {s?.starts_at && d ? (
        <>
          <section className="calendar-summary" aria-label="Scheduled step">
            <span className="section-label">Your next step</span>
            <h2>{d.action}</h2>
            <p>{displaySchedule(s.local_date, s.local_time, s.time_zone)}</p>
          </section>
          <fieldset className="es-chip-group">
            <legend>How long</legend>
            {[15, 30, 45, 60, 90, 120].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={minutes === n}
                onClick={() => setMinutes(n)}
              >
                {n < 60 ? n + " min" : n / 60 + (n === 60 ? " hour" : " hours")}
              </button>
            ))}
          </fieldset>
          <a
            className="button calendar-action"
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
            className="button calendar-action"
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
  snapshot,
  navigate,
  selectedTile,
}: {
  goal: Goal;
  selectedTile?: number;
  snapshot?: Snapshot;
  navigate: (p: string) => void;
}) {
  const [step, setStep] = useState(0),
    [words, setWords] = useState(goal.words),
    [content, setContent] = useState("challenge"),
    [milestoneId, setMilestoneId] = useState(goal.milestones[0]?.id || ""),
    [reason, setReason] = useState(false),
    [date, setDate] = useState(false),
    [brand, setBrand] = useState(true),
    [placement, setPlacement] = useState("lock"),
    [sharing, setSharing] = useState(false),
    [style, setStyle] = useState<string>(
      wallpaperColors[selectedTile ?? 0]?.id || "ink",
    ),
    [error, setError] = useState(""),
    [saveMessage, setSaveMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const palette =
    wallpaperColors.find((c) => c.id === style) || wallpaperColors[0];
  const light = palette.foreground === "#101A20";
  const reflection = snapshot
    ? completedEvent(snapshot, goal.id)?.data.reflection
    : undefined;
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  useEffect(() => {
    let alive = true;
    let url = "";
    setImageBlob(null);
    setSaveMessage("");
    async function createPreview() {
      setBusy(true);
      setError("");
      try {
        await document.fonts.ready;
        const canvas = document.createElement("canvas");
        canvas.width = 1170;
        canvas.height = 2532;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = palette.background;
        ctx.fillRect(0, 0, 1170, 2532);
        ctx.fillStyle = palette.foreground;
        ctx.font = "78px Newsreader, Georgia, serif";
        ctx.textAlign = "center";
        // Center the complete statement in the selected reserved area.
        const center =
          placement === "top" ? 620 : placement === "rows" ? 910 : 1050;
        ctx.textBaseline = "middle";
        let y = 0;
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
          throw new Error("Shorten the wording so it fits your wallpaper.");
        const reasonLines: string[] = [];
        if (reason) {
          ctx.font =
            '32px "Avenir Next", Avenir, Montserrat, Arial, sans-serif';
          let line = "";
          for (const word of goal.meaning.split(/\s+/)) {
            const next = (line + " " + word).trim();
            if (ctx.measureText(next).width > 920 && line) {
              reasonLines.push(line);
              line = word;
            } else line = next;
          }
          if (line) reasonLines.push(line);
          if (
            reasonLines.length > 5 ||
            reasonLines.some((l) => ctx.measureText(l).width > 920)
          )
            throw new Error(
              "Your reason needs more space. Turn off Add my reason to save this wallpaper.",
            );
        }
        const blockHeight =
          lines.length * 100 +
          (reasonLines.length ? 40 + reasonLines.length * 44 : 0);
        if (
          placement !== "lock" &&
          blockHeight > (placement === "rows" ? 300 : 420)
        )
          throw new Error(
            "Shorten your words or turn off Add my reason to fit the reserved Home Screen space.",
          );
        y = center - blockHeight / 2 + 50;
        ctx.font = "78px Newsreader, Georgia, serif";
        for (const l of lines) {
          ctx.fillText(l, 585, y);
          y += 100;
        }
        ctx.font = '32px "Avenir Next", Avenir, Montserrat, Arial, sans-serif';
        reasonLines.forEach((l, i) => ctx.fillText(l, 585, y + 12 + i * 44));
        const brandY = placement === "lock" ? 1940 : 1800;
        if (date) {
          ctx.font =
            '28px "Avenir Next", Avenir, Montserrat, Arial, sans-serif';
          ctx.fillText(
            displayDate(new Date().toLocaleDateString("en-CA")),
            585,
            brandY - 100,
          );
        }
        if (brand) {
          const logo = new Image();
          logo.src = mark;
          await logo.decode();
          if (!light) {
            ctx.fillStyle = "#f1f3f1";
            ctx.beginPath();
            ctx.arc(407.5, brandY, 34, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.drawImage(logo, 380, brandY - 28, 55, 56);
          ctx.fillStyle = light ? "#101A20" : "#f1f3f1";
          ctx.font =
            '24px "Avenir Next", Avenir, Montserrat, Arial, sans-serif';
          ctx.fillText("E A R N E D   S E L F", 630, brandY);
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
  }, [
    words,
    reason,
    date,
    brand,
    style,
    placement,
    goal.meaning,
    palette,
  ]);
  async function save() {
    if (!imageBlob || sharing) return;
    setSharing(true);
    setError("");
    setSaveMessage("");
    const file = new File([imageBlob], "Earned_Self_Lock_Screen.png", {
      type: "image/png",
    });
    try {
      // The PNG already exists: invoke sharing directly from the tap, before
      // any awaited image generation can consume transient user activation.
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Earned Self vision",
        });
        // A resolved share does not confirm a Photos save. Keep the screen quiet.
      } else if (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      ) {
        setError(
          window.isSecureContext
            ? "Image sharing is unavailable in this browser. Open this page in Safari and try Save to phone again."
            : "Saving to Photos needs a secure connection. Open the HTTPS preview link and try Save to phone again.",
        );
      } else {
        download(imageBlob, "Earned_Self_Lock_Screen.png");
        setSaveMessage(
          "Download started. Look for Earned_Self_Lock_Screen.png in Downloads. Your phone may also show it in Gallery. Photos backup is not automatic.",
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError(
          "Your phone could not open image sharing. Nothing was confirmed saved. Please try Save to phone again.",
        );
    } finally {
      setSharing(false);
    }
  }
  return (
    <Page
      className="wallpaper-editor"
      title={step === 0 ? "Words worth carrying." : "Keep it in sight."}
      sub={
        step === 0
          ? "Choose what belongs on your wallpaper."
          : "Preview before you save."
      }
      dark={false}
      back={() => (step ? setStep(0) : navigate("/app"))}
      footer={
        <>
          {error && <p role="alert">{error}</p>}
          <button
            className="button"
            disabled={!words.trim() || busy || sharing || !imageBlob}
            onClick={() => (step ? void save() : setStep(1))}
          >
            {busy
              ? "Creating image…"
              : step
                ? sharing
                  ? "Sharing…"
                  : "Save to phone"
                : placement === "lock"
                  ? "Preview lock screen"
                  : "Preview Home Screen"}
          </button>
          {step === 1 && (
            <button className="quiet" onClick={() => setStep(0)}>
              Edit words
            </button>
          )}
          {step === 1 && (
            <p>
              On iPhone, choose Save Image in the share sheet. On Android,
              choose an available image destination.
            </p>
          )}
          {step === 1 && (
            <button className="quiet" onClick={() => navigate("/app")}>
              Return to Now
            </button>
          )}
          {saveMessage && <p role="status">{saveMessage}</p>}
        </>
      }
    >
      {step === 0 && (
        <>
          {previewUrl && (
            <img
              className="wallpaper-image wallpaper-live-preview"
              src={previewUrl}
              alt="Your wallpaper image preview"
            />
          )}
          <fieldset className="es-chip-group wallpaper-content">
            <legend>What would you like to carry?</legend>
            {[
              ["challenge", "Challenge", goal.words],
              [
                "milestone",
                "Milestone",
                goal.milestones.find((m) => m.id === milestoneId)?.title || "",
              ],
              ["becoming", "Becoming", goal.vision],
            ].map(([id, label, value]) => (
              <button
                key={id}
                type="button"
                aria-pressed={content === id}
                disabled={!value.trim()}
                onClick={() => {
                  setContent(id);
                  setWords(value);
                }}
              >
                {label}
              </button>
            ))}
          </fieldset>
          {!goal.milestones.length && (
            <p className="small">Add a milestone in Plan to use it here.</p>
          )}
          {!goal.vision.trim() && (
            <p className="small">
              Your becoming statement will appear here once it is saved.
            </p>
          )}
          {content === "milestone" && (
            <fieldset className="wallpaper-milestones">
              <legend>Choose your milestone</legend>
              {goal.milestones.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="experience-choice"
                  aria-pressed={milestoneId === m.id}
                  onClick={() => {
                    setMilestoneId(m.id);
                    setWords(m.title);
                  }}
                >
                  {m.title}
                </button>
              ))}
            </fieldset>
          )}
          <Input
            label="Words to carry"
            value={words}
            onChange={(value) => {
              setWords(value);
              setContent("custom");
            }}
            placeholder="Type here…"
          />
          <button
            className="quiet"
            onClick={() => {
              setWords(goal.vision);
              setContent("becoming");
            }}
          >
            Use my own vision
          </button>
          {reflection && (
            <button
              className="quiet"
              onClick={() => {
                setWords(reflection);
                setContent("custom");
              }}
            >
              Use my own reflection
            </button>
          )}
          <p className="small">
            Edits here only change your wallpaper. Your saved challenge stays as
            it is.
          </p>
          <fieldset className="es-chip-group">
            <legend>Where will you use it?</legend>
            {[
              ["lock", "Lock Screen"],
              ["rows", "Home Screen · Between rows"],
              ["top", "Home Screen · At the top"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={placement === id}
                onClick={() => {
                  setPlacement(id);
                }}
              >
                {label}
              </button>
            ))}
          </fieldset>
          <p className="small">
            {placement === "lock"
              ? "Leave the top clear for your clock."
              : placement === "top"
                ? "Leave the top two app rows empty. Place your widgets and apps below the words."
                : "Leave a row empty below your top widget. The words are centered in that space."}{" "}
            Keep the bottom row clear for the Earned Self mark above Search.
            Leave the selected area clear of apps and widgets.
          </p>
          <fieldset className="wallpaper-styles">
            <legend>Choose a brand color</legend>
            {wallpaperColors.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="wallpaper-swatch"
                style={{
                  background: choice.background,
                  color: choice.foreground,
                }}
                aria-pressed={style === choice.id}
                aria-label={choice.label}
                onClick={() => setStyle(choice.id)}
              >
                <span>{choice.label}</span>
              </button>
            ))}
          </fieldset>
          <p className="small">
            Your preview is the image that will be saved. Keep the wallpaper
            unzoomed when setting it on your phone.
          </p>
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
      {step === 1 && previewUrl && (
        <img
          className="wallpaper-image"
          src={previewUrl}
          alt="Your wallpaper image preview"
        />
      )}
    </Page>
  );
}
const challengeState: Record<string, string> = {
  draft: "Getting ready",
  active: "In progress",
  paused: "Paused",
  completed: "Completed",
  changed_direction: "Changed direction",
  abandoned: "Ended",
};
export function Settings({
  email,
  snapshot,
  navigate,
  signOut,
  selectAmbition,
  saving,
}: {
  email: string;
  snapshot: Snapshot;
  navigate: (p: string) => void;
  save: (mode: string) => void;
  signOut: () => void;
  selectAmbition: (id: string) => void;
  saving: boolean;
}) {
  return (
    <Page
      className="account-page"
      title="Your account."
      sub="Your profile, challenges and account."
      dark={false}
      back={() => navigate("/app")}
    >
      <section className="account-identity">
        <span className="section-label">Signed in as</span>
        <p>{email || "Local preview account"}</p>
      </section>
      <section className="account-section" aria-label="Profile photo">
        <ProfilePhotoEditor />
      </section>
      <section
        className="account-section"
        aria-labelledby="account-data-heading"
      >
        <h2 id="account-data-heading">Your challenges & data.</h2>
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
          <fieldset className="es-choice-group">
            <legend>Your challenges</legend>
            {snapshot.goals.map((g) => (
              <button
                key={g.id}
                type="button"
                className="experience-choice es-challenge-row"
                aria-pressed={snapshot.selectedGoal === g.id}
                disabled={saving}
                onClick={() => selectAmbition(g.id)}
              >
                <span>{g.words || g.vision}</span>
                <small>{challengeState[g.status]}</small>
              </button>
            ))}
          </fieldset>
        )}
        <button className="experience-choice" onClick={() => navigate("/new")}>
          Begin another challenge
        </button>
      </section>
      <button className="quiet" disabled={saving} onClick={signOut}>
        Sign out
      </button>
    </Page>
  );
}
