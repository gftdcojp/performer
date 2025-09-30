// Web Components Implementation
// Merkle DAG: ui-node -> web-components

import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element"
import { ActorCoordinator } from "@/actor/business-actor"
import { DomainEvent } from "@/domain/types"

// Base Web Component Class
@customElement("performer-component")
export class PerformerComponent extends FASTElement {
  // Merkle DAG: base-component
  @observable actorCoordinator?: ActorCoordinator
  @observable currentState: Record<string, unknown> = {}
  @observable events: readonly DomainEvent[] = []

  connectedCallback(): void {
    super.connectedCallback()
    this.initializeComponent()
  }

  private initializeComponent(): void {
    // Subscribe to actor state changes
    if (this.actorCoordinator) {
      // Actor subscription logic would go here
    }
  }

  protected updateState(newState: Record<string, unknown>): void {
    this.currentState = { ...this.currentState, ...newState }
    this.requestUpdate()
  }

  protected emitEvent(event: DomainEvent): void {
    this.events = [...this.events, event]
    this.dispatchEvent(new CustomEvent('domain-event', { detail: event }))
  }
}

// Business Entity Component
@customElement("business-entity")
export class BusinessEntityComponent extends PerformerComponent {
  // Merkle DAG: entity-component
  @attr entityId?: string
  @attr entityType?: string
  @observable entityData: Record<string, unknown> = {}

  static definition = {
    name: "business-entity",
    template: html<BusinessEntityComponent>`
      <div class="entity-container">
        <header class="entity-header">
          <h3>${x => x.entityType} - ${x => x.entityId}</h3>
          <span class="entity-status">${x => this.getStatusText(x)}</span>
        </header>
        <div class="entity-content">
          ${x => this.renderEntityFields(x)}
        </div>
        <footer class="entity-actions">
          <button @click=${x => x.handleEdit()}>Edit</button>
          <button @click=${x => x.handleSave()}>Save</button>
          <button @click=${x => x.handleDelete()}>Delete</button>
        </footer>
      </div>
    `,
    styles: css`
      .entity-container {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin: 8px 0;
        background: white;
      }

      .entity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .entity-header h3 {
        margin: 0;
        color: #333;
      }

      .entity-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        background: #e8f5e8;
        color: #2e7d32;
      }

      .entity-content {
        margin-bottom: 12px;
      }

      .entity-field {
        margin-bottom: 8px;
      }

      .entity-field label {
        display: block;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .entity-field input,
      .entity-field textarea,
      .entity-field select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .entity-actions {
        display: flex;
        gap: 8px;
      }

      .entity-actions button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }

      .entity-actions button:hover {
        opacity: 0.9;
      }

      .entity-actions button:first-child {
        background: #2196f3;
        color: white;
      }

      .entity-actions button:nth-child(2) {
        background: #4caf50;
        color: white;
      }

      .entity-actions button:last-child {
        background: #f44336;
        color: white;
      }
    `
  }

  private getStatusText(component: BusinessEntityComponent): string {
    return component.currentState.status as string || 'Active'
  }

  private renderEntityFields(component: BusinessEntityComponent): any {
    const fields = Object.entries(component.entityData)
    return html`
      ${fields.map(([key, value]) => html`
        <div class="entity-field">
          <label for="${key}">${key}</label>
          <input
            id="${key}"
            type="text"
            .value="${String(value)}"
            @input=${(e: Event) => this.handleFieldChange(key, (e.target as HTMLInputElement).value)}
          />
        </div>
      `)}
    `
  }

  private handleFieldChange(field: string, value: string): void {
    this.entityData = { ...this.entityData, [field]: value }
  }

  private handleEdit(): void {
    this.emitEvent({
      entityId: this.entityId || '',
      eventType: 'entity_edit_started',
      payload: { entityId: this.entityId },
      timestamp: new Date(),
      version: 1,
    })
  }

  private handleSave(): void {
    this.emitEvent({
      entityId: this.entityId || '',
      eventType: 'entity_saved',
      payload: { ...this.entityData },
      timestamp: new Date(),
      version: 1,
    })
  }

  private handleDelete(): void {
    this.emitEvent({
      entityId: this.entityId || '',
      eventType: 'entity_deleted',
      payload: { entityId: this.entityId },
      timestamp: new Date(),
      version: 1,
    })
  }
}

// Actor State Display Component
@customElement("actor-state-display")
export class ActorStateDisplayComponent extends PerformerComponent {
  // Merkle DAG: state-display-component
  @attr actorId?: string
  @observable actorState: Record<string, unknown> = {}

  static definition = {
    name: "actor-state-display",
    template: html<ActorStateDisplayComponent>`
      <div class="state-container">
        <h4>Actor State: ${x => x.actorId}</h4>
        <pre class="state-json">${x => JSON.stringify(x.actorState, null, 2)}</pre>
        <div class="state-events">
          <h5>Recent Events</h5>
          <ul>
            ${x => x.events.slice(-5).map(event => html`
              <li class="event-item">
                <span class="event-type">${event.eventType}</span>
                <span class="event-time">${event.timestamp.toLocaleTimeString()}</span>
              </li>
            `)}
          </ul>
        </div>
      </div>
    `,
    styles: css`
      .state-container {
        border: 1px solid #2196f3;
        border-radius: 8px;
        padding: 16px;
        background: #f8f9fa;
      }

      .state-container h4 {
        margin: 0 0 12px 0;
        color: #1976d2;
      }

      .state-json {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        font-size: 0.8em;
        overflow-x: auto;
        margin-bottom: 12px;
      }

      .state-events h5 {
        margin: 0 0 8px 0;
        color: #333;
      }

      .event-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid #eee;
      }

      .event-type {
        font-weight: bold;
        color: #2196f3;
      }

      .event-time {
        font-size: 0.8em;
        color: #666;
      }
    `
  }
}

// Component Registry
export class ComponentRegistry {
  // Merkle DAG: component-registry
  private components = new Map<string, typeof PerformerComponent>()

  register(name: string, component: typeof PerformerComponent): void {
    this.components.set(name, component)
    // Register with custom elements registry if not already registered
    if (!customElements.get(name)) {
      customElements.define(name, component)
    }
  }

  get(name: string): typeof PerformerComponent | undefined {
    return this.components.get(name)
  }

  list(): readonly string[] {
    return Array.from(this.components.keys())
  }
}
