import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@fontsource-variable/figtree";
import "@fontsource-variable/newsreader";
import "./presentation.css";
import "./statement.css";
import "./earned.css";
import "./entry.css";
import type { Adapter } from "./data/types";
async function start() {
  let adapter: Adapter;
  if (__LOCAL_PREVIEW__) {
    const { enablePhonePreview } = await import("./preview/phone");
    enablePhonePreview();
    const { createPreviewAdapter } = await import("./preview/adapter");
    adapter = createPreviewAdapter();
  } else {
    const { createSupabaseAdapter } = await import("./data/supabase");
    adapter = createSupabaseAdapter();
  }
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App adapter={adapter} />
    </React.StrictMode>,
  );
}
start().catch(() => {
  document.getElementById("root")!.textContent =
    "Earned Self could not start. Please refresh the page. If this keeps happening, contact support.";
});
