import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { calendarMiddleware } from "./scripts/calendar-middleware.mjs";
export default defineConfig(({ command, mode }) => {
  if (
    command === "build" &&
    (mode === "preview-local" ||
      process.env.VITE_PREVIEW_MODE ||
      process.env.VITE_LOCAL_PREVIEW)
  )
    throw new Error(
      "Local preview cannot be built for deployment. Use the normal build.",
    );
  return {
    plugins: [
      react(),
      {
        name: "local-calendar-response",
        configureServer(server) {
          server.middlewares.use(calendarMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use(calendarMiddleware);
        },
      },
    ],
    define: {
      __LOCAL_PREVIEW__: JSON.stringify(
        command === "serve" && mode === "preview-local",
      ),
    },
    build: { sourcemap: false },
    test: {
      environment: "jsdom",
      include: ["tests/*.test.ts", "tests/*.test.tsx"],
      setupFiles: ["./tests/setup.ts"],
    },
  };
});
