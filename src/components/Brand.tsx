import mark from "../assets/mark-transparent.png";
import light from "../assets/wordmark.png";
import dark from "../assets/wordmark-dark.png";
export function Mark({ mineral = false }: { mineral?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={"brand-symbol " + (mineral ? "on-mineral" : "on-ink")}
    >
      <img src={mark} alt="" />
    </span>
  );
}
export function Brand({ mineral = false }: { mineral?: boolean }) {
  return (
    <span className="brand-lockup">
      <Mark mineral={mineral} />
      <img
        className="brand-wordmark"
        src={mineral ? dark : light}
        alt="Earned Self"
      />
    </span>
  );
}
