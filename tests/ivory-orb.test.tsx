import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StepTimer } from "../src/experience/StepTimer";
import {
  deviceSchedule,
  displaySchedule,
  scheduledInstant,
} from "../src/data/time";
import { ScheduleFields } from "../src/components/PursuitScreens";
beforeEach(() => {
  cleanup();
  localStorage.clear();
});
it("orb motion state follows persisted clock and pause without changing elapsed time", () => {
  const v = render(
    <StepTimer identity="orb">
      <h2>A long action stays outside the orb</h2>
    </StepTimer>,
  );
  expect(document.querySelector(".timer-face h2")).toBeNull();
  expect(document.querySelector(".step-timer")).toHaveAttribute(
    "data-running",
    "false",
  );
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  expect(document.querySelector(".step-timer")).toHaveAttribute(
    "data-running",
    "true",
  );
  v.unmount();
  render(<StepTimer identity="orb" />);
  expect(screen.getByRole("button", { name: "Pause timer" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
  expect(document.querySelector(".step-timer")).toHaveAttribute(
    "data-running",
    "false",
  );
  expect(
    JSON.parse(localStorage.getItem("earned-self:timer:orb")!).started,
  ).toBeNull();
});
it("100-hour sessions retain every digit inside the orb", () => {
  localStorage.setItem(
    "earned-self:timer:long",
    JSON.stringify({ elapsed: 360000000, started: null }),
  );
  render(<StepTimer identity="long" />);
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("100:00:00");
  expect(screen.getByLabelText("Elapsed time")).toHaveClass("timer-hours");
});
it("device display preserves the saved instant across a date boundary without mutating it", () => {
  const original = {
    localDate: "2030-01-01",
    localTime: "00:15",
    timeZone: "Pacific/Kiritimati",
  };
  const input = { ...original };
  const converted = deviceSchedule(input);
  expect(input).toEqual(original);
  expect(
    scheduledInstant(
      converted.localDate,
      converted.localTime,
      converted.timeZone,
    ),
  ).toBe(
    scheduledInstant(original.localDate, original.localTime, original.timeZone),
  );
  expect(
    displaySchedule(input.localDate, input.localTime, input.timeZone),
  ).not.toContain("Pacific");
});
it("editing a displayed time uses device settings only after user input", () => {
  const change = vi.fn();
  const value = {
    localDate: "2030-01-01",
    localTime: "00:15",
    timeZone: "Pacific/Kiritimati",
  };
  const shown = deviceSchedule(value);
  render(<ScheduleFields value={value} change={change} />);
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Action date")).toHaveValue(shown.localDate);
  expect(screen.queryByLabelText("Action time zone")).toBeNull();
  fireEvent.change(screen.getByLabelText("Action time"), {
    target: { value: "09:30" },
  });
  expect(change).toHaveBeenCalledWith({
    ...shown,
    localTime: "09:30",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
});
it("legacy DST gaps remain unshifted for explicit review", () => {
  const v = {
    localDate: "2030-03-10",
    localTime: "02:30",
    timeZone: "America/Denver",
  };
  expect(deviceSchedule(v)).toEqual(v);
  expect(displaySchedule(v.localDate, "", v.timeZone)).toBe("03/10/2030");
});
