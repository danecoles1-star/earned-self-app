type GuidanceKind = "milestone" | "step" | "criterion" | "obstacle";
// Specific activities take precedence over broad nouns such as "business".
export function guidanceExample(challenge: string, kind: GuidanceKind): string {
  const text = challenge.toLowerCase();
  let examples: Record<GuidanceKind, string>;
  if (
    /\b(present(?:ation)?|speak(?:ing)?|speech|talk|keynote|pitch)\b/.test(text)
  )
    examples = {
      milestone:
        "Rehearse the full talk for two listeners and answer their questions.",
      step: "Rehearse the opening aloud once and note where the message is unclear.",
      criterion:
        "Deliver the full talk within the allotted time, then answer two practice questions.",
      obstacle:
        "If a listener cancels, record the rehearsal and ask for feedback before the next practice.",
    };
  else if (/\b(climb|mountains?|peaks?|hike|hiking|trails?)\b/.test(text))
    examples = {
      milestone:
        "Complete a shorter route with similar terrain before attempting the main climb.",
      step: "Compare two preparation routes and record their distance, elevation, and conditions.",
      criterion:
        "Record the route completed, the time taken, and what still needs preparation.",
      obstacle:
        "If conditions make the route unsafe, choose an indoor preparation session and review a new route date.",
    };
  else if (/\b(stretch|stretching|flexibility|mobility)\b/.test(text))
    examples = {
      milestone:
        "Complete the full mobility routine independently and review your range of movement.",
      step: "Practice the chosen routine for ten minutes and note how it feels.",
      criterion:
        "Finish the selected movements and record what felt comfortable or limited.",
      obstacle:
        "If the morning session is interrupted, use a shorter planned session at lunch.",
    };
  else if (/\b(essays?|articles?|books?|writing|writer)\b/.test(text))
    examples = {
      milestone:
        "Finish a complete draft and ask one reader where the argument is unclear.",
      step: "Write one opening paragraph for the draft.",
      criterion: "Save a complete paragraph that states the main idea.",
      obstacle:
        "If the opening stalls, draft the section you understand best and return to it later.",
    };
  else if (
    /\b(start|launch|build|grow)\b.*\b(business|company|venture)\b|\bcustomers?\b/.test(
      text,
    )
  )
    examples = {
      milestone:
        "Test the proposed offer with three potential customers and record their feedback.",
      step: "Write one question to ask a potential customer about their current problem.",
      criterion: "Save the question and identify a person to ask.",
      obstacle:
        "If no one replies, revise the invitation and approach another relevant contact.",
    };
  else if (/\b(song|music|album)\b/.test(text))
    examples = {
      milestone: "Perform a complete rough version for one listener.",
      step: "Record one short musical phrase.",
      criterion: "Save a recording you can listen back to.",
      obstacle:
        "If the recording setup fails, capture a simple voice memo and arrange a new recording session.",
    };
  else
    examples = {
      milestone:
        "A milestone demonstrates growing readiness. A preparation step practices one part of it.",
      step: "Choose one part of your next milestone to practice, research, or arrange in a single session.",
      criterion:
        "Name the observable result: what will be finished, recorded, or demonstrated?",
      obstacle:
        "Use your actual obstacle: “If [obstacle] happens, I will [feasible response] at [time or place].”",
    };
  return examples[kind];
}
export function firstMoveExample(challenge: string): string | undefined {
  const example = guidanceExample(challenge, "step");
  return example.startsWith("Choose one part") ? undefined : example;
}
