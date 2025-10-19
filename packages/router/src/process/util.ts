// Merkle DAG: process/util -> normalization -> total-order
import { TASKS, TaskName } from "./types";

export const makeZeroDistribution = (): Record<TaskName, number> =>
	Object.fromEntries(TASKS.map((t) => [t, 0])) as Record<TaskName, number>;

export const normalizeDistribution = (
	partial: Partial<Record<TaskName, number>>,
): Record<TaskName, number> => {
	const base = makeZeroDistribution();
	for (const t of TASKS) base[t] = partial[t] ?? 0;
	return base;
};
