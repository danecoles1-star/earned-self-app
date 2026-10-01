import { useEffect, useState, useRef } from "react";
import { displayDate, displayTime } from "../data/time";
export function LocalDateTimeInput({
  id,
  kind,
  value,
  onChange,
  required,
}: {
  id: string;
  kind: "date" | "time";
  value: string;
  onChange: (s: string) => void;
  required: boolean;
}) {
  const format = kind === "date" ? displayDate : displayTime;
  const [text, setText] = useState(format(value));
  const emitted = useRef(value);
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setText(format(value));
    }
  }, [value]);
  return (
    <input
      id={id}
      type="text"
      required={required}
      value={text}
      placeholder={kind === "date" ? "MM/DD/YYYY" : "hh:mm AM/PM"}
      autoComplete="off"
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        let next = "";
        if (kind === "date") {
          const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (m) {
            const iso = `${m[3]}-${m[1]}-${m[2]}`;
            const date = new Date(iso + "T12:00:00Z");
            if (
              Number.isFinite(+date) &&
              date.toISOString().slice(0, 10) === iso
            )
              next = iso;
          }
        } else {
          const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (m && +m[1] >= 1 && +m[1] <= 12 && +m[2] < 60)
            next =
              String(
                (+m[1] % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0),
              ).padStart(2, "0") +
              ":" +
              m[2];
        }
        if (next !== value) {
          emitted.current = next;
          onChange(next);
        }
      }}
    />
  );
}
