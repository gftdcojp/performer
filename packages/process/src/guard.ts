// Merkle DAG: process/guard -> effect-validated-io -> safe-to-ui
import { Effect } from "effect";
import { ProcessMetadataSchema, StatsSchema } from "./schemas";
import * as S from "@effect/schema/Schema";
import { normalizeDistribution } from "./util";

export const parseProcessMetadata = (u: unknown) =>
  Effect.try({
    try: () => S.parseSync(ProcessMetadataSchema)(u),
    catch: (e) => e as Error
  });

export const parseStats = (u: unknown) =>
  Effect.try({
    try: () => {
      const s = S.parseSync(StatsSchema)(u);
      return { ...s, taskDistribution: normalizeDistribution(s.taskDistribution) };
    },
    catch: (e) => e as Error
  });


