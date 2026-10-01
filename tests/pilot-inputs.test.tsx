import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { LocalDateTimeInput } from "../src/components/LocalDateTime";
import { calendarContent } from "../src/experience/exports";

it("date and AM/PM entry retain partial typing and reject invalid dates", async () => {
  function Fields() {
    const [date, setDate] = useState(""),
      [time, setTime] = useState("");
    return (
      <>
        <label htmlFor="day">Day</label>
        <LocalDateTimeInput
          id="day"
          kind="date"
          value={date}
          onChange={setDate}
          required
        />
        <label htmlFor="time">Time</label>
        <LocalDateTimeInput
          id="time"
          kind="time"
          value={time}
          onChange={setTime}
          required
        />
        <output>
          {date}|{time}
        </output>
      </>
    );
  }
  render(<Fields />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Day"), "02/30/2030");
  expect(screen.getByRole("status")).toHaveTextContent("|");
  await user.clear(screen.getByLabelText("Day"));
  await user.type(screen.getByLabelText("Day"), "11/02/2030");
  await user.type(screen.getByLabelText("Time"), "6:30 PM");
  expect(screen.getByRole("status")).toHaveTextContent("2030-11-02|18:30");
});
it("recurring calendar uses wall time, explicit zone transitions and a weekday recurrence", () => {
  const event = calendarContent(
    { action: "Stretch", criterion: "Ten minutes" } as any,
    {
      commitment_id: "series",
      starts_at: "2030-11-02T12:00:00Z",
      local_date: "2030-11-02",
      local_time: "06:00",
      time_zone: "America/Denver",
      location: "",
    } as any,
    10,
    "https://earnedself.com",
    { days: [0, 1, 2, 3, 4, 5, 6], until: "2030-11-04" },
  );
  expect(event).toContain("BEGIN:VTIMEZONE");
  expect(event).toContain("DTSTART;TZID=America/Denver:20301102T060000");
  expect(event).toContain("RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA");
  expect(event).toContain("TZOFFSETTO:-0700");
  expect(event).toContain("TZOFFSETTO:-0600");
});
