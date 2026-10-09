import { AreaTabs, AreaContext } from "./Areas";
import { artFor } from "./workshopArt";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Brand } from "../components/Brand";
import { useContext } from "react";
import { ProfileContext } from "./ProfilePhoto";
import account from "../assets/icons/user-round.svg";

export function Stage({
  title,
  hero,
  children,
  navigate,
  tone = "prepare",
  back,
  backLabel = "Back to Proof",
  statement = title === "Your Proof"
    ? "The evidence is stacking up, keep going"
    : undefined,
}: {
  title: string;
  hero?: ReactNode;
  statement?: string;
  children: ReactNode;
  navigate: (path: string) => void;
  tone?: "focus" | "prepare" | "plan" | "proof" | "completed";
  back?: () => void;
  backLabel?: string;
}) {
  const { photo } = useContext(ProfileContext);
  const heading = useRef<HTMLHeadingElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [mineralHeight, setMineralHeight] = useState(0);
  useLayoutEffect(() => {
    if ((tone !== "plan" && !hero) || !surface.current) return;
    const root = surface.current;
    const measure = () => {
      const end =
        root.querySelector(
          ".stage-hero, .workshop-path, .workshop-path-empty",
        ) || root.querySelector(".plan-challenge");
      if (end)
        setMineralHeight(
          end.getBoundingClientRect().bottom - root.getBoundingClientRect().top,
        );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    const end = root.querySelector(
      ".stage-hero, .workshop-path, .workshop-path-empty",
    );
    if (end) observer.observe(end);
    return () => observer.disconnect();
  }, [tone, children, hero]);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div
      ref={surface}
      className={`focus-stage stage-${tone}${hero ? " has-progress-hero" : ""}`}
    >
      {(tone === "plan" || hero) && (
        <div
          className="plan-mineral-surface"
          style={{ height: mineralHeight }}
          aria-hidden="true"
        />
      )}
      <header className="stage-header">
        <Brand mineral={tone !== "plan" && !hero} />
        <button
          className="quiet account-button"
          aria-label="Account"
          onClick={() => navigate("/settings")}
        >
          <img
            className={photo ? "profile-photo" : undefined}
            src={photo || account}
            alt=""
          />
        </button>
      </header>
      <main id="main" className="stage-main">
        {!back && ["focus", "plan", "proof"].includes(tone) && <AreaTabs />}
        {back && (
          <button className="quiet stage-back" onClick={back}>
            {backLabel}
          </button>
        )}
        <h1
          ref={heading}
          tabIndex={-1}
          className={
            tone === "focus" || statement || hero
              ? "visually-hidden"
              : "stage-title"
          }
        >
          {title}
        </h1>
        {hero}
        {statement && (
          <section className="identity-reminder page-identity">
            <span className="section-label">{title}</span>
            <p>{statement}</p>
          </section>
        )}
        {children}
      </main>
    </div>
  );
}

export function Landscape({
  scene = "basecamp",
  area,
}: {
  scene?: "basecamp" | "plan" | "proof" | "completed";
  area?: import("../data/types").GrowthArea | null;
}) {
  const context = useContext(AreaContext);
  const selectedArea = area === undefined ? context.area : area;
  if (!selectedArea) return null;
  return (
    <img
      className={`stage-landscape landscape-${scene}`}
      src={artFor(
        area === undefined ? context.area : area,
        scene === "completed",
      )}
      alt=""
      aria-hidden="true"
    />
  );
}
