import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import type { Adapter } from "./data/types";
import "./styles.css";
import "./marketing.css";
import "./logo.css";
import "./experience/experience.css";
import "./experience/focus-stage.css";
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
    "The application configuration needs attention. No account data was loaded. Please contact the private-test organizer.";
});
