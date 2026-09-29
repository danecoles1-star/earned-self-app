import type { IncomingMessage, ServerResponse } from "node:http";
export function calendarMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void;
