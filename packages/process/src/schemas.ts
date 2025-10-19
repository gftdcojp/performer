// Merkle DAG: process/schemas -> runtime-validation -> ui-guard
import * as S from "@effect/schema/Schema";
import { TASKS } from "./types";

export const TaskNameSchema = S.union(...TASKS.map(S.literal));
export const TaskInfoSchema = S.struct({
  category: S.string,
  assignee: S.optional(S.string),
  priority: S.optional(S.union(S.literal("low"), S.literal("normal"), S.literal("high"), S.literal("critical")))
});

export const ProcessMetadataSchema = S.struct({
  id: S.string,
  name: S.string,
  categories: S.record(S.string, S.struct({ name: S.string, color: S.string, description: S.string })),
  tasks: S.record(TaskNameSchema, TaskInfoSchema).pipe(S.partial)
});

export const StatsSchema = S.struct({
  totalProcesses: S.number,
  activeProcesses: S.number,
  completedToday: S.number,
  averageProcessingTime: S.string,
  slaCompliance: S.number,
  taskDistribution: S.record(TaskNameSchema, S.number).pipe(S.partial),
  categoryStats: S.record(S.string, S.struct({ total: S.number, completed: S.number, avgTime: S.number }))
});


