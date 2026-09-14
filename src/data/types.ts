export type Result = "done" | "partly" | "did_not_happen";
export type Mode = "deliberate" | "quick";
export interface User {
  id: string;
  email?: string;
}
export interface Goal {
  id: string;
  owner_id: string;
  words: string;
  kind: "goal" | "vision";
  meaning: string | null;
  created_at: string;
  version: number;
}
export interface Commitment {
  id: string;
  owner_id: string;
  goal_id: string;
  revision: number;
  version: number;
  state: "active" | "reported";
  created_at: string;
}
export interface Definition {
  commitment_id: string;
  goal_id: string;
  revision: number;
  action: string;
  criterion: string;
  mode: Mode;
}
export interface Schedule {
  id: string;
  commitment_id: string;
  goal_id: string;
  commitment_revision: number;
  local_date: string | null;
  local_time: string | null;
  time_zone: string | null;
  starts_at: string | null;
  location: string | null;
}
export interface Evidence {
  id: string;
  goal_id: string;
  commitment_id: string;
  commitment_revision: number;
  schedule_id: string | null;
  revision: number;
  recorded_at: string;
  version: number;
}
export interface Report {
  evidence_id: string;
  goal_id: string;
  revision: number;
  result: Result;
  detail: string | null;
  reflection: string | null;
  occurred_on: string | null;
  recorded_at: string;
}
export interface Snapshot {
  goals: Goal[];
  commitments: Commitment[];
  definitions: Definition[];
  schedules: Schedule[];
  evidence: Evidence[];
  reports: Report[];
  selectedGoal: string | null;
  supportMode: "guided" | "on_request";
}
export interface Command {
  operationId: string;
  actorId: string;
  kind: "goal" | "commitment" | "outcome" | "detail" | "select" | "support";
  payload: Record<string, unknown>;
}
export interface Receipt {
  id: string;
  version: number;
}
export interface Adapter {
  readonly preview: boolean;
  readonly configured: boolean;
  getUser(): Promise<User | null>;
  subscribe(cb: (user: User | null) => void): () => void;
  signIn(email: string): Promise<void>;
  signOut(): Promise<void>;
  read(): Promise<Snapshot>;
  execute(command: Command): Promise<Receipt>;
  enterPreview?(): Promise<void>;
  failNext?(): void;
}
export const emptySnapshot = (): Snapshot => ({
  goals: [],
  commitments: [],
  definitions: [],
  schedules: [],
  evidence: [],
  reports: [],
  selectedGoal: null,
  supportMode: "guided",
});
export const resultLabel: Record<Result, string> = {
  done: "Done",
  partly: "Partly",
  did_not_happen: "Didn’t happen",
};
