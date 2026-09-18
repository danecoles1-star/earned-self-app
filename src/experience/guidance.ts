// Explicit, optional examples. Never populate an answer or claim an action happened.
export function firstMoveExample(ambition: string): string | undefined {
  const words = ambition.toLowerCase();
  if (/\b(essay|article|book|writing|writer)\b/.test(words))
    return `For “${ambition}”, write one opening sentence that expresses what you want a reader to understand. Done means that sentence exists in your draft.`;
  if (/\b(climb|mountain|peak|hike|trail)\b/.test(words))
    return `For “${ambition}”, identify your intended route and record one preparation requirement you still need to investigate. Done means you have the route and that question written down.`;
  if (/\b(business|customer|company|venture)\b/.test(words))
    return `For “${ambition}”, write one question you need a potential customer to answer. Done means you can name the person you would ask and the question.`;
  if (/\b(song|music|album)\b/.test(words))
    return `For “${ambition}”, record one short musical idea. Done means you have a recording you can return to.`;
  return undefined;
}
