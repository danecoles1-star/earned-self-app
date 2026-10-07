import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Brand } from "../components/Brand";
import steps from "../assets/workshop/plan-doors.webp";
import { AreaContext } from "./Areas";
import { areaArt, preparationArt, proofArt } from "./workshopArt";
import path from "../assets/workshop/prepare-personal.webp";
import mountain from "../assets/workshop/proof-personal.webp";
export const artwork = { steps, path, mountain };
export function Art({ kind }: { kind: keyof typeof artwork }) {
  const { area } = useContext(AreaContext);
  const source = area
    ? (kind === "path"
        ? preparationArt
        : kind === "mountain"
          ? proofArt
          : areaArt)[area]
    : steps;
  return <img className="experience-art" src={source} alt="" />;
}
export function Page({
  title,
  sub,
  children,
  back,
  dark: _dark = true,
  footer,
  progress,
  layout = "flow",
  className = "",
}: {
  layout?: "flow" | "welcome";
  className?: string;
  title: string;
  sub?: string;
  children: ReactNode;
  back?: () => void;
  dark?: boolean;
  footer?: ReactNode;
  progress?: [number, number];
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div
      className={
        "experience experience-" + layout + " " + "mineral " + className
      }
    >
      <header className="experience-header">
        <Brand mineral />
        {back && (
          <button className="quiet" onClick={back} aria-label="Go back">
            Back
          </button>
        )}
      </header>
      <main id="main" className="experience-main">
        <div className="experience-heading">
          {progress && (
            <div
              className="journey-progress"
              aria-label={`Step ${progress[0]} of ${progress[1]}`}
            >
              <span
                style={{ width: `${(progress[0] / progress[1]) * 100}%` }}
              />
            </div>
          )}
          <h1 ref={heading} tabIndex={-1}>
            {title}
          </h1>
          {sub && <p className="experience-sub">{sub}</p>}
        </div>
        <div className="experience-content">{children}</div>
      </main>
      {footer && <footer className="experience-footer">{footer}</footer>}
    </div>
  );
}
export function Input({
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="open-input">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        required={required}
        maxLength={10000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
      />
    </div>
  );
}
export function Choice({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="experience-choice"
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="choice-dot" aria-hidden="true" />
      {children}
    </button>
  );
}
export const SupportMode = createContext<"guided" | "on_request">("on_request");
export function Help({
  ambition,
  field,
  example,
}: {
  ambition: string;
  field: string;
  example?: string;
}) {
  const mode = useContext(SupportMode);
  const [open, setOpen] = useState(false);
  return (
    <div className="context-help">
      {mode === "guided" && !open && <p className="small">{field}</p>}
      <button
        type="button"
        className="quiet"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Help me find the words
      </button>
      {open && (
        <div role="region" aria-label="Writing guidance">
          <p>{ambition ? `For “${ambition}”, ${field}` : field}</p>
          {example && (
            <p>
              <strong>One possibility:</strong> {example} Choose it only if it
              serves your challenge.
            </p>
          )}
          <p>Write what is true for you. You can refine it as you learn.</p>
        </div>
      )}
    </div>
  );
}
