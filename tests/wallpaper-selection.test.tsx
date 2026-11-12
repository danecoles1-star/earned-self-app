import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Wallpaper } from "../src/experience/Carry";
import { foundation } from "./fixtures";
import type { Goal } from "../src/data/types";

const goal: Goal = {
  ...foundation,
  id: "g",
  owner_id: "a",
  kind: "goal",
  created_at: "",
  version: 1,
  revision: 1,
  status: "active",
};
const fillText = vi.fn();
beforeEach(() => {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillText,
    measureText: (text: string) => ({ width: text.length * 30 }),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => callback(new Blob(["png"], { type: "image/png" })),
  );
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 1170;
      naturalHeight = 2532;
      src = "";
      decode() {
        return Promise.resolve();
      }
    },
  );
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
  fillText.mockClear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("exports saved challenge, chosen milestone and becoming without changing the goal", async () => {
  render(<Wallpaper goal={goal} navigate={() => {}} />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Preview lock screen" }),
    ).toBeEnabled(),
  );
  expect(screen.getByLabelText("Words to carry")).toHaveValue(goal.words);
  fireEvent.click(
    screen.getByRole("button", { name: "Milestone", exact: true }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Launch shop", exact: true }),
  );
  await waitFor(() =>
    expect(fillText).toHaveBeenCalledWith("Launch shop", 585, 1050),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Becoming", exact: true }),
  );
  expect(screen.getByLabelText("Words to carry")).toHaveValue(goal.vision);
  await waitFor(() =>
    expect(fillText).toHaveBeenCalledWith(goal.vision, 585, 1050),
  );
  fireEvent.change(screen.getByLabelText("Words to carry"), {
    target: { value: "My wallpaper only" },
  });
  expect(goal.vision).toBe(foundation.vision);
  expect(
    screen.getByRole("button", { name: "Becoming", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});
it("explains unavailable milestones and offers five plain brand colors", async () => {
  render(<Wallpaper goal={{ ...goal, milestones: [] }} navigate={() => {}} />);
  expect(
    screen.getByRole("button", { name: "Milestone", exact: true }),
  ).toBeDisabled();
  expect(
    screen.getByText("Add a milestone in Plan to use it here."),
  ).toBeVisible();
  expect(document.querySelectorAll(".wallpaper-swatch")).toHaveLength(5);
  fireEvent.click(
    screen.getByRole("button", { name: "Earned Gold", exact: true }),
  );
  expect(
    screen.getByRole("button", { name: "Earned Gold", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Preview lock screen" }),
    ).toBeEnabled(),
  );
});
it("blocks export when a single word would overflow instead of clipping it", async () => {
  render(<Wallpaper goal={goal} navigate={() => {}} />);
  fireEvent.change(screen.getByLabelText("Words to carry"), {
    target: { value: "x".repeat(100) },
  });
  await screen.findByRole("alert");
  expect(
    screen.getByRole("button", { name: "Preview lock screen" }),
  ).toBeDisabled();
});

async function openExport() {
  render(<Wallpaper goal={goal} navigate={() => {}} />);
  const preview = await screen.findByRole("button", {
    name: "Preview lock screen",
  });
  await waitFor(() => expect(preview).toBeEnabled());
  fireEvent.click(preview);
  return screen.getByRole("button", { name: "Save to phone" });
}
it("shares the generated PNG from one save action without reporting Photos success", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { canShare: () => true, share });
  fireEvent.click(await openExport());
  expect(share).toHaveBeenCalledTimes(1);
  const file = share.mock.calls[0][0].files[0];
  expect(file.name).toBe("Earned_Self_Lock_Screen.png");
  expect(file.type).toBe("image/png");
  expect(file.size).toBe(3);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save to phone" })).toBeEnabled(),
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByText("Download image")).not.toBeInTheDocument();
  expect(screen.queryByText("Open full-size image")).not.toBeInTheDocument();
});
it("explains unsupported iPhone sharing instead of silently doing nothing", async () => {
  vi.stubGlobal("navigator", {
    userAgent: "iPhone",
    platform: "iPhone",
    maxTouchPoints: 5,
  });
  fireEvent.click(await openExport());
  expect(await screen.findByRole("alert")).toHaveTextContent("HTTPS preview");
});
it("reports share failures but treats user cancellation as cancellation", async () => {
  const share = vi
    .fn()
    .mockRejectedValue(new DOMException("blocked", "NotAllowedError"));
  vi.stubGlobal("navigator", { canShare: () => true, share });
  const save = await openExport();
  fireEvent.click(save);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Nothing was confirmed saved",
  );
  share.mockRejectedValue(new DOMException("cancelled", "AbortError"));
  fireEvent.click(save);
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("starts a PNG download when Android cannot share files", async () => {
  vi.stubGlobal("navigator", { userAgent: "Android", canShare: () => false });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  fireEvent.click(await openExport());
  expect(click).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole("status")).toHaveTextContent("Downloads");
});

it("keeps multiline text and branding in each selected wallpaper area", async () => {
  render(
    <Wallpaper
      goal={{ ...goal, words: "Change the world with Earned Self today" }}
      navigate={() => {}}
    />,
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Preview lock screen" }),
    ).toBeEnabled(),
  );
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();

  for (const [name, firstY, secondY, brandY, preview] of [
    ["Home Screen · Between rows", 860, 960, 1800, "Preview Home Screen"],
    ["Home Screen · At the top", 570, 670, 1800, "Preview Home Screen"],
    ["Lock Screen", 1000, 1100, 1940, "Preview lock screen"],
  ] as const) {
    fillText.mockClear();
    fireEvent.click(screen.getByRole("button", { name, exact: true }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: preview }),
      ).toBeEnabled();
      expect(fillText).toHaveBeenCalledWith(
        "Change the world with Earned", 585, firstY,
      );
      expect(fillText).toHaveBeenCalledWith("Self today", 585, secondY);
      expect(fillText).toHaveBeenCalledWith(
        "E A R N E D   S E L F", 630, brandY,
      );
    });
    expect(fillText).toHaveBeenCalledTimes(3);
  }
});
it("blocks oversized Home Screen text blocks instead of overlapping app rows", async () => {
  render(
    <Wallpaper
      goal={{ ...goal, meaning: "a reason ".repeat(15) }}
      navigate={() => {}}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Home Screen · Between rows",
      exact: true,
    }),
  );
  fireEvent.change(screen.getByLabelText("Words to carry"), {
    target: { value: "A long statement ".repeat(4) },
  });
  fireEvent.click(screen.getByLabelText("Add my reason"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "reserved Home Screen space",
  );
  expect(
    screen.getByRole("button", { name: "Preview Home Screen" }),
  ).toBeDisabled();
});
it("prevents a second share while the first share sheet is open and permits retry", async () => {
  let finish!: () => void;
  const share = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("navigator", { canShare: () => true, share });
  fireEvent.click(await openExport());
  const sharing = screen.getByRole("button", { name: "Sharing…" });
  expect(sharing).toBeDisabled();
  fireEvent.click(sharing);
  expect(share).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save to phone" })).toBeEnabled(),
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
