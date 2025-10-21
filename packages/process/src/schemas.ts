// Merkle DAG: process/schemas -> ontology -> runtime-validation -> ui-guard
import * as S from "@effect/schema/Schema";
import { TASKS } from "./types";
import { ProcessInstanceSchema, PerformerSchemas } from "@gftdcojp/ai-gftd-ontology-typebox";
import { DODAF_RELATIONSHIP_METAMODEL, validateElementAgainstMetaModel } from "@gftdcojp/ai-gftd-ontology-typebox";

export const TaskNameSchema = S.Union(...TASKS.map(S.Literal));
export const TaskInfoSchema = S.Struct({
	category: S.String,
	assignee: S.optional(S.String),
	priority: S.optional(
		S.Union(
			S.Literal("low"),
			S.Literal("normal"),
			S.Literal("high"),
			S.Literal("critical"),
		),
	),
});

export const ProcessMetadataSchema = S.Struct({
	id: S.String,
	name: S.String,
	categories: S.Record(
		S.String,
		S.Struct({ name: S.String, color: S.String, description: S.String }),
	),
	// allow sparse task maps (Record in @effect/schema does not require all keys to exist)
	tasks: S.Record(TaskNameSchema, TaskInfoSchema),
});

export const StatsSchema = S.Struct({
	totalProcesses: S.Number,
	activeProcesses: S.Number,
	completedToday: S.Number,
	averageProcessingTime: S.String,
	slaCompliance: S.Number,
	// sparse distribution map
	taskDistribution: S.Record(TaskNameSchema, S.Number),
	categoryStats: S.Record(
		S.String,
		S.Struct({ total: S.Number, completed: S.Number, avgTime: S.Number }),
	),
});

// Ontology-integrated schemas
export const OntologyProcessInstanceSchema = S.Union(ProcessInstanceSchema);

// DoDAF Meta Model Validation
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export function validateProcessInstance(instance: any): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// TypeBox schema validation
	const typeBoxResult = PerformerSchemas.ProcessInstance.safeParse(instance);
	if (!typeBoxResult.success) {
		errors.push(...typeBoxResult.error.errors.map(e => e.message));
	}

	// DoDAF meta model validation
	const metaModelResult = validateElementAgainstMetaModel(instance, 'OperationalActivity');
	if (!metaModelResult.valid) {
		errors.push(...metaModelResult.errors);
	}

	// Business rule validations
	if (!instance.tenantId) {
		errors.push("Process instance must have tenantId");
	}
	if (!instance.userId) {
		errors.push("Process instance must have userId");
	}
	if (instance.status === 'running' && !instance.startTime) {
		errors.push("Running process must have startTime");
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

export function validateProcessDefinition(definition: any): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Basic structure validation
	if (!definition.id) {
		errors.push("Process definition must have id");
	}
	if (!definition.name) {
		errors.push("Process definition must have name");
	}
	if (!definition.xml || typeof definition.xml !== 'string') {
		errors.push("Process definition must have valid BPMN XML");
	}

	// BPMN XML basic validation
	if (definition.xml && !definition.xml.includes('<bpmn:definitions')) {
		errors.push("Invalid BPMN XML format");
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}
