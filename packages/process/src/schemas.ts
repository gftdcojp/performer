// Merkle DAG: process/schemas -> runtime-validation -> ui-guard
import * as S from "@effect/schema/Schema";
import { TASKS } from "./types";

export const TaskNameSchema = S.Union(...TASKS.map(S.Literal));
export const TaskInfoSchema = S.Struct({
  category: S.String,
  assignee: S.optional(S.String),
  priority: S.optional(S.Union(S.Literal("low"), S.Literal("normal"), S.Literal("high"), S.Literal("critical")))
});

export const ProcessMetadataSchema = S.Struct({
  id: S.String,
  name: S.String,
  categories: S.Record(S.String, S.Struct({ name: S.String, color: S.String, description: S.String })),
  // allow sparse task maps (Record in @effect/schema does not require all keys to exist)
  tasks: S.Record(TaskNameSchema, TaskInfoSchema)
});

export const StatsSchema = S.Struct({
  totalProcesses: S.Number,
  activeProcesses: S.Number,
  completedToday: S.Number,
  averageProcessingTime: S.String,
  slaCompliance: S.Number,
  // sparse distribution map
  taskDistribution: S.Record(TaskNameSchema, S.Number),
  categoryStats: S.Record(S.String, S.Struct({ total: S.Number, completed: S.Number, avgTime: S.Number }))
});


