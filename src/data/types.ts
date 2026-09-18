export type Result = "done" | "partly" | "did_not_happen";
export type PursuitState =
  | "draft"
  | "active"
  | "paused"
  | "changed_direction"
  | "completed"
  | "abandoned";
export interface User {
  id: string;
  email?: string;
}
export interface Milestone {
  id: string;
  title: string;
  criterion: string;
  localDate: string;
  localTime: string;
  timeZone: string;
}
export interface Foundation {
  words: string;
  vision: string;
  outcome: string;
  meaning: string;
  constraints: string;
  capabilities: string;
  unknowns: string;
  affirmed: boolean;
  milestones: Milestone[];
}
export interface Goal extends Foundation {
  id: string;
  owner_id: string;
  kind: "goal" | "vision";
  created_at: string;
  version: number;
  revision: number;
  status: PursuitState;
}
export interface GoalRevision extends Foundation {
  goal_id: string;
  revision: number;
  recorded_at: string;
}
export interface Commitment {
  id: string;
  owner_id: string;
  goal_id: string;
  milestone_id: string | null;
  plan_revision: number | null;
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
  mode: "deliberate" | "quick";
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
  state: "current" | "superseded";
  created_at: string;
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
  prevented: string | null;
  adjustment: string | null;
}
export interface PursuitEvent {
  id: string;
  goal_id: string;
  kind:
    | "reschedule"
    | "milestone_schedule"
    | "milestone"
    | "status"
    | "decision";
  data: Record<string, string>;
  recorded_at: string;
}
export interface Snapshot {
  goals: Goal[];
  goalHistory: GoalRevision[];
  events: PursuitEvent[];
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
  kind:
    | "first_move"
    | "goal"
    | "plan"
    | "commitment"
    | "reschedule"
    | "milestone_schedule"
    | "milestone"
    | "status"
    | "outcome"
    | "detail"
    | "select"
    | "support";
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
export const emptyFoundation = (): Foundation => ({
  words: "",
  vision: "",
  outcome: "",
  meaning: "",
  constraints: "",
  capabilities: "",
  unknowns: "",
  affirmed: false,
  milestones: [],
});
export const emptySnapshot = (): Snapshot => ({
  goals: [],
  goalHistory: [],
  events: [],
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
  partly: "Partly done",
  did_not_happen: "Didn’t happen",
};
export const stateLabel: Record<PursuitState, string> = {
  draft: "Draft pursuit",
  active: "Active pursuit",
  paused: "Paused pursuit",
  changed_direction: "Changed direction",
  completed: "Major accomplishment completed",
  abandoned: "Abandoned pursuit",
};
