// Merkle DAG: process_core -> ontology -> bpmn_dsl -> engine -> task_handlers
// BPMN SDK wrapper for DSL->IR->engine, start/signal/message, human task/SLA

/// <reference lib="dom" />
import {
    processErrorFactory,
    withErrorHandling,
    ErrorCodes,
    ErrorSeverity,
} from "@gftdcojp/performer-error-handling";
import { ProcessInstanceSchema, TenantContextSchema, TenantProcessConfigSchema } from "@gftdcojp/ai-gftd-ontology-typebox";
import { Static } from "@sinclair/typebox";

// Dynamic import for browser-only modules
let BpmnModeler: any = null;
let BpmnViewer: any = null;

if (typeof window !== "undefined") {
	// Browser environment - dynamically import BPMN modules
	import("bpmn-js/lib/Modeler").then((module) => {
		BpmnModeler = module.default;
	}).catch(() => {
		// Silently fail in non-browser environments
	});

	import("bpmn-js/lib/Viewer").then((module) => {
		BpmnViewer = module.default;
	}).catch(() => {
		// Silently fail in non-browser environments
	});
}
export * from "./types";
// export * from "./schemas"; // Temporarily disabled due to @effect/schema Record issue
export * from "./util";
// export * from "./guard"; // Temporarily disabled due to schemas dependency

export interface ProcessDefinition {
	id: string;
	name: string;
	xml: string;
}

// Use ProcessInstance from ontology
export type ProcessInstance = Static<typeof ProcessInstanceSchema>;

// Tenant-aware types
export type TenantContext = Static<typeof TenantContextSchema>;
export type TenantProcessConfig = Static<typeof TenantProcessConfigSchema>;

// Tenant Context Manager for process execution
export class TenantProcessContextManager {
	constructor(private tenantContext: TenantContext) {}

	// Validate if user has permission to execute process
	validateProcessPermission(processType: string): boolean {
		// Check tenant-specific permissions
		const hasTenantPermission = this.tenantContext.permissions.includes(`process:${processType}:execute`);

		// Check role-based permissions
		const hasRolePermission = this.tenantContext.userRoles.some(role =>
			role === 'admin' || role === 'process_manager' || role === `process_${processType}_executor`
		);

		return hasTenantPermission || hasRolePermission;
	}

	// Get tenant-specific process configuration
	getTenantProcessConfig(processType: string): TenantProcessConfig | null {
		// In real implementation, this would be fetched from database
		// For now, return default config based on tenant settings
		const tenantSettings = this.tenantContext.settings;

		return {
			tenantId: this.tenantContext.tenantId,
			processDefinitions: [{
				id: `${processType}-default`,
				name: `Default ${processType} Process`,
				version: "1.0.0",
				isActive: true,
				settings: tenantSettings,
			}],
			workflowRules: [{
				ruleId: `tenant-${this.tenantContext.tenantId}-rule-1`,
				processType,
				conditions: {
					tenantId: this.tenantContext.tenantId,
					userRole: this.tenantContext.userRoles[0] || 'user',
				},
				actions: ['validate', 'execute', 'notify'],
			}],
			slaSettings: {
				[processType]: {
					maxDuration: tenantSettings.maxProcessDuration || 3600000, // 1 hour default
					priority: tenantSettings.defaultPriority || 'normal',
					escalationRules: ['email_notification', 'supervisor_alert'],
				},
			},
		};
	}

	// Apply tenant-specific validation rules
	validateTenantProcessRules(processData: any, processType: string): { valid: boolean; errors: string[] } {
		const errors: string[] = [];
		const config = this.getTenantProcessConfig(processType);

		if (!config) {
			errors.push(`No tenant configuration found for process type: ${processType}`);
			return { valid: false, errors };
		}

		// Validate against tenant-specific rules
		const rules = config.workflowRules.filter(rule => rule.processType === processType);

		for (const rule of rules) {
			if (!this.evaluateTenantRule(rule, processData)) {
				errors.push(`Tenant rule violation: ${rule.ruleId}`);
			}
		}

		// Validate SLA settings
		const sla = config.slaSettings[processType];
		if (sla) {
			const currentTime = Date.now();
			const startTime = new Date(processData.startTime || currentTime).getTime();

			if (currentTime - startTime > sla.maxDuration) {
				errors.push(`Process exceeded tenant SLA duration: ${sla.maxDuration}ms`);
			}
		}

		return { valid: errors.length === 0, errors };
	}

	private evaluateTenantRule(rule: any, processData: any): boolean {
		// Simple rule evaluation - in real implementation, use a proper rule engine
		for (const [key, expectedValue] of Object.entries(rule.conditions)) {
			const actualValue = processData[key] || this.tenantContext[key as keyof TenantContext];
			if (actualValue !== expectedValue) {
				return false;
			}
		}
		return true;
	}

	// Get tenant-specific process variables
	getTenantProcessVariables(baseVariables: Record<string, any> = {}): Record<string, any> {
		return {
			...baseVariables,
			tenantId: this.tenantContext.tenantId,
			tenantName: this.tenantContext.tenantName,
			tenantDomain: this.tenantContext.tenantDomain,
			userId: this.tenantContext.userId,
			userRoles: this.tenantContext.userRoles,
			tenantSettings: this.tenantContext.settings,
		};
	}
}

export interface Task {
	id: string;
	name: string;
	type: "user" | "service" | "send" | "receive" | "manual" | "businessRule";
	assignee?: string;
	dueDate?: Date;
	priority?: number;
	variables: Record<string, any>;
}

export interface ProcessContext {
	instance: ProcessInstance;
	currentTask?: Task;
}

// BPMN DSL Builder (enhanced)
export class ProcessBuilder {
	private xml: string = "";
	private currentPaths: string[] = [];

	constructor(
		private processId: string,
		private processName: string,
	) {}

	startEvent(id: string, name?: string): ProcessBuilder {
		this.xml += `
      <bpmn:startEvent id="${id}"${name ? ` name="${name}"` : ""} />`;
		return this;
	}

	endEvent(id: string, name?: string): ProcessBuilder {
		this.xml += `
      <bpmn:endEvent id="${id}"${name ? ` name="${name}"` : ""} />`;
		return this;
	}

	userTask(id: string, name: string): ProcessBuilder {
		this.xml += `
      <bpmn:userTask id="${id}" name="${name}" />`;
		return this;
	}

	serviceTask(id: string, name: string): ProcessBuilder {
		this.xml += `
      <bpmn:serviceTask id="${id}" name="${name}" />`;
		return this;
	}

	exclusiveGateway(id: string, name?: string): ProcessBuilder {
		this.xml += `
      <bpmn:exclusiveGateway id="${id}"${name ? ` name="${name}"` : ""} />`;
		return this;
	}

	parallelGateway(id: string, name?: string): ProcessBuilder {
		this.xml += `
      <bpmn:parallelGateway id="${id}"${name ? ` name="${name}"` : ""} />`;
		return this;
	}

	sequenceFlow(
		source: string,
		target: string,
		condition?: string,
	): ProcessBuilder {
		this.xml += `
      <bpmn:sequenceFlow sourceRef="${source}" targetRef="${target}"${condition ? ` name="${condition}"` : ""} />`;
		return this;
	}

	// Enhanced DSL methods
	when(conditionName: string, options?: { expr?: string }): ProcessBuilder {
		// For exclusive gateway conditions - simplified implementation
		return this;
	}

	otherwise(): ProcessBuilder {
		// For exclusive gateway default path - simplified implementation
		return this;
	}

	path(pathName: string): ProcessBuilder {
		this.currentPaths.push(pathName);
		return this;
	}

	moveTo(targetId: string): ProcessBuilder {
		// For complex routing - simplified implementation
		return this;
	}

	build(): ProcessDefinition {
		const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                        xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                        id="Definitions_1"
                        targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn:process id="${this.processId}" name="${this.processName}" isExecutable="true">
          ${this.xml}
        </bpmn:process>
      </bpmn:definitions>`;

		return {
			id: this.processId,
			name: this.processName,
			xml: fullXml,
		};
	}
}

// Process Engine
export class ProcessEngine {
	private modeler: any = null;
	private instances: Map<string, ProcessInstance> = new Map();
	private tasks: Map<string, Task[]> = new Map();

	constructor() {
		// Initialize BPMN modeler only in browser environment
		if (typeof window !== "undefined" && BpmnModeler) {
			this.modeler = new BpmnModeler();
		}
	}

	async deployProcess(definition: ProcessDefinition): Promise<void> {
		return withErrorHandling(
			async () => {
				// Validate BPMN XML (skip in Node.js environment)
				if (this.modeler) {
					try {
						await this.modeler.importXML(definition.xml);
					} catch (error) {
						throw processErrorFactory.createError(
							ErrorCodes.BPMN_VALIDATION_FAILED,
							"Invalid BPMN XML",
							"deployProcess",
							{
								cause: error as Error,
								severity: ErrorSeverity.HIGH,
								suggestedAction: "Check BPMN XML syntax and structure",
								metadata: {
									processId: definition.id,
									processName: definition.name,
								},
							},
						);
					}
				}
				// In real implementation, store in database
			},
			processErrorFactory,
			"deployProcess",
		);
	}

	async startProcess(
		processId: string,
		businessKey: string,
		variables: Record<string, any> = {},
	): Promise<ProcessInstance> {
		const instance: ProcessInstance = {
			id: `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			processId,
			businessKey,
			status: "running",
			variables,
			startTime: new Date(),
		};

		this.instances.set(instance.id, instance);
		this.tasks.set(instance.id, []);

		// Simulate starting the process
		// In real implementation, use BPMN engine to execute
		await this.executeNextTask(instance);

		return instance;
	}

	async signalProcess(
		instanceId: string,
		signalName: string,
		variables?: Record<string, any>,
	): Promise<void> {
		const instance = this.instances.get(instanceId);
		if (!instance) throw new Error(`Process instance ${instanceId} not found`);

		if (variables) {
			Object.assign(instance.variables, variables);
		}

		// Handle signal - simplified implementation
		await this.executeNextTask(instance);
	}

	async messageProcess(
		instanceId: string,
		messageName: string,
		variables?: Record<string, any>,
	): Promise<void> {
		const instance = this.instances.get(instanceId);
		if (!instance) throw new Error(`Process instance ${instanceId} not found`);

		if (variables) {
			Object.assign(instance.variables, variables);
		}

		// Handle message - simplified implementation
		await this.executeNextTask(instance);
	}

	async completeTask(
		instanceId: string,
		taskId: string,
		variables?: Record<string, any>,
	): Promise<void> {
		const instance = this.instances.get(instanceId);
		if (!instance) throw new Error(`Process instance ${instanceId} not found`);

		const tasks = this.tasks.get(instanceId) || [];
		const taskIndex = tasks.findIndex((t) => t.id === taskId);
		if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);

		tasks.splice(taskIndex, 1);

		if (variables) {
			Object.assign(instance.variables, variables);
		}

		await this.executeNextTask(instance);
	}

	private async executeNextTask(instance: ProcessInstance): Promise<void> {
		// Simplified task execution
		// In real implementation, this would parse BPMN and execute appropriate tasks
		const mockTask: Task = {
			id: `task-${Date.now()}`,
			name: "Mock User Task",
			type: "user",
			variables: instance.variables,
		};

		const tasks = this.tasks.get(instance.id) || [];
		tasks.push(mockTask);
		this.tasks.set(instance.id, tasks);
	}

	getTasks(instanceId: string): Task[] {
		return this.tasks.get(instanceId) || [];
	}

	getInstance(instanceId: string): ProcessInstance | undefined {
		return this.instances.get(instanceId);
	}
}

// DSL helper
export function flow(
	id: string,
	name: string,
	builder: (p: ProcessBuilder) => ProcessBuilder,
): ProcessDefinition {
	const processBuilder = new ProcessBuilder(id, name);
	return builder(processBuilder).build();
}

// Export singleton engine instance (lazy initialization for test compatibility)
let _processEngine: ProcessEngine | null = null;
export const processEngine = (() => {
	if (!_processEngine) {
		_processEngine = new ProcessEngine();
	}
	return _processEngine;
})();
