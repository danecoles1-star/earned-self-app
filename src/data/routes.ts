/** Explicit routes prevent unknown addresses from exposing retired screens. */
export function isAppRoute(path: string): boolean {
  if (
    [
      "/",
      "/app",
      "/auth",
      "/auth/callback",
      "/new",
      "/start",
      "/resume-entry",
      "/proof",
      "/manage",
      "/manage/why",
      "/settings",
    ].includes(path)
  )
    return true;
  return (
    /^\/(?:import-first|add-step|add-milestone|plan|commitment|revise|recovery|proof|milestone|resume|decision|milestone-done|calendar|wallpaper|focus|report)\/[^/]+$/.test(
      path,
    ) ||
    /^\/revise\/[^/]+\/[^/]+$/.test(path) ||
    /^\/proof\/challenge\/[^/]+$/.test(path)
  );
}
