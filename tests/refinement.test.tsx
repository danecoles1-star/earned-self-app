import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { StepTimer, elapsedTime } from "../src/experience/StepTimer";
import {
  ProfileContext,
  ProfileProvider,
  prepareProfilePhoto,
} from "../src/experience/ProfilePhoto";
import { useContext } from "react";
import type { Adapter } from "../src/data/types";
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it("timer marker freezes exactly on pause and resumes from that accumulated position", () => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  let callback: FrameRequestCallback = () => {};
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    callback = cb;
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  render(<StepTimer identity="smooth" />);
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  act(() => {
    vi.setSystemTime(104000);
    callback(0);
  });
  const orbit = document.querySelector<HTMLElement>(".timer-orbit")!;
  expect(orbit.style.transform).toBe("rotate(125deg)");
  fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
  expect(orbit.style.transform).toBe("rotate(125deg)");
  act(() => vi.setSystemTime(120000));
  expect(orbit.style.transform).toBe("rotate(125deg)");
  fireEvent.click(screen.getByRole("button", { name: "Resume timer" }));
  expect(orbit.style.transform).toBe("rotate(125deg)");
  act(() => {
    vi.setSystemTime(122000);
    callback(0);
  });
  expect(orbit.style.transform).toBe("rotate(170deg)");
  expect(
    elapsedTime(
      JSON.parse(localStorage.getItem("earned-self:timer:smooth")!),
      122000,
    ),
  ).toBe(6000);
});
it("reduced motion keeps the marker still without stopping dedicated time", () => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  render(<StepTimer identity="reduced" />);
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:05");
  expect(
    document.querySelector<HTMLElement>(".timer-orbit")!.style.transform,
  ).toBe("rotate(35deg)");
  vi.unstubAllGlobals();
});
it("rejects non-image and oversized profile uploads before decoding", async () => {
  await expect(
    prepareProfilePhoto(new File(["x"], "bad.svg", { type: "image/svg+xml" })),
  ).rejects.toThrow("Choose a JPG");
  const large = new File([new Uint8Array(16 * 1024 * 1024)], "large.jpg", {
    type: "image/jpeg",
  });
  await expect(prepareProfilePhoto(large)).rejects.toThrow(
    "smaller than 15 MB",
  );
});
it("late profile responses cannot leak a previous account's photo", async () => {
  let resolvePhoto: (value: Blob) => void = () => {};
  const first = new Promise<Blob>((resolve) => {
    resolvePhoto = resolve;
  });
  const getProfilePhoto = vi
    .fn()
    .mockReturnValueOnce(first)
    .mockResolvedValueOnce(null);
  const adapter = { getProfilePhoto } as unknown as Adapter;
  function Display() {
    const value = useContext(ProfileContext);
    return <p>{value.photo || "No photo"}</p>;
  }
  const root = render(
    <ProfileProvider adapter={adapter} owner="a">
      <Display />
    </ProfileProvider>,
  );
  root.rerender(
    <ProfileProvider adapter={adapter} owner="b">
      <Display />
    </ProfileProvider>,
  );
  await act(async () =>
    resolvePhoto(new Blob(["old"], { type: "image/webp" })),
  );
  expect(screen.getByText("No photo")).toBeVisible();
  await waitFor(() => expect(getProfilePhoto).toHaveBeenCalledTimes(2));
});
