import { useEffect, useRef, type ReactNode } from "react";
import { Brand } from "../components/Brand";
import account from "../assets/icons/user-round.svg";

export function Stage({
  title,
  children,
  navigate,
  tone = "prepare",
  back,
  backLabel = "Back to Proof",
}: {
  title: string;
  children: ReactNode;
  navigate: (path: string) => void;
  tone?: "focus" | "prepare" | "proof" | "completed";
  back?: () => void;
  backLabel?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div className={`focus-stage stage-${tone}`}>
      <header className="stage-header">
        <Brand mineral />
        <button
          className="quiet account-button"
          aria-label="Account"
          onClick={() => navigate("/settings")}
        >
          <img src={account} alt="" />
        </button>
      </header>
      <main id="main" className="stage-main">
        {back && (
          <button className="quiet stage-back" onClick={back}>
            {backLabel}
          </button>
        )}
        <h1
          ref={heading}
          tabIndex={-1}
          className={tone === "focus" ? "visually-hidden" : "stage-title"}
        >
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
