// Merkle DAG: rpc_streaming -> websocket_sse_bridge -> event_streaming -> real_time_communication
// WebSocket and Server-Sent Events streaming support for real-time RPC

import type { OrpcRouter } from "./router";
import type { Context } from "./context";

// Streaming event types
export interface StreamingEvent {
	type: string;
	data: unknown;
	id?: string;
	timestamp?: Date;
	correlationId?: string;
}

// WebSocket connection state
export interface WebSocketConnection {
	id: string;
	context: Context;
	send: (event: StreamingEvent) => void;
	close: () => void;
	isAlive: boolean;
	lastPing: Date;
	subscriptions: Set<string>;
}

// Server-Sent Events connection state
export interface SSEConnection {
	id: string;
	context: Context;
	controller: ReadableStreamDefaultController;
	response: ReadableStream;
	isAlive: boolean;
	lastActivity: Date;
	subscriptions: Set<string>;
}

// Streaming configuration
export interface StreamingConfig {
	heartbeatInterval?: number; // Default: 30000ms
	maxConnections?: number; // Default: 1000
	eventBufferSize?: number; // Default: 100
	connectionTimeout?: number; // Default: 300000ms (5 minutes)
	enableCompression?: boolean; // Default: false
}

// Event broker for pub/sub
export class EventBroker {
	private subscribers = new Map<string, Set<WebSocketConnection | SSEConnection>>();
	private eventBuffer = new Map<string, StreamingEvent[]>();
	private maxBufferSize: number;

	constructor(maxBufferSize = 100) {
		this.maxBufferSize = maxBufferSize;
	}

	// Subscribe to event type
	subscribe(eventType: string, connection: WebSocketConnection | SSEConnection): void {
		if (!this.subscribers.has(eventType)) {
			this.subscribers.set(eventType, new Set());
		}
		this.subscribers.get(eventType)!.add(connection);
		connection.subscriptions.add(eventType);
	}

	// Unsubscribe from event type
	unsubscribe(eventType: string, connection: WebSocketConnection | SSEConnection): void {
		const subs = this.subscribers.get(eventType);
		if (subs) {
			subs.delete(connection);
			connection.subscriptions.delete(eventType);

			// Clean up empty sets
			if (subs.size === 0) {
				this.subscribers.delete(eventType);
			}
		}
	}

	// Unsubscribe from all event types for a connection
	unsubscribeAll(connection: WebSocketConnection | SSEConnection): void {
		for (const eventType of connection.subscriptions) {
			this.unsubscribe(eventType, connection);
		}
	}

	// Publish event to all subscribers
	publish(event: StreamingEvent): void {
		// Add timestamp if not present
		const enrichedEvent = {
			...event,
			timestamp: event.timestamp || new Date(),
		};

		// Buffer event for late subscribers
		if (!this.eventBuffer.has(event.type)) {
			this.eventBuffer.set(event.type, []);
		}
		const buffer = this.eventBuffer.get(event.type)!;
		buffer.push(enrichedEvent);

		// Maintain buffer size
		if (buffer.length > this.maxBufferSize) {
			buffer.shift();
		}

		// Send to all subscribers (if any)
		const subs = this.subscribers.get(event.type);
		if (subs) {
			for (const connection of subs) {
				try {
					if (this.isWebSocketConnection(connection)) {
						connection.send(enrichedEvent);
					} else {
						this.sendToSSE(connection, enrichedEvent);
					}
				} catch (error) {
					console.error(`Failed to send event to connection ${connection.id}:`, error);
				}
			}
		}
	}

	// Get buffered events for event type
	getBufferedEvents(eventType: string, since?: Date): StreamingEvent[] {
		const buffer = this.eventBuffer.get(eventType) || [];
		if (!since) return [...buffer];

		return buffer.filter(event => event.timestamp && event.timestamp >= since);
	}

	private isWebSocketConnection(conn: WebSocketConnection | SSEConnection): conn is WebSocketConnection {
		return 'send' in conn && typeof conn.send === 'function';
	}

	private sendToSSE(connection: SSEConnection, event: StreamingEvent): void {
		try {
			const eventData = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
			connection.controller.enqueue(new TextEncoder().encode(eventData));
			connection.lastActivity = new Date();
		} catch (error) {
			console.error(`Failed to send SSE event:`, error);
		}
	}
}

// WebSocket handler factory
export function createWebSocketHandler<C extends Context>(
	router: OrpcRouter<C>,
	eventBroker: EventBroker,
	config: StreamingConfig = {},
) {
	const {
		heartbeatInterval = 30000,
		maxConnections = 1000,
		connectionTimeout = 300000,
	} = config;

	const connections = new Map<string, WebSocketConnection>();
	let connectionCount = 0;

	// Heartbeat management
	const heartbeatIntervalId = setInterval(() => {
		const now = new Date();
		for (const [id, conn] of connections) {
			if (now.getTime() - conn.lastPing.getTime() > connectionTimeout) {
				conn.close();
				connections.delete(id);
				connectionCount--;
			} else if (conn.isAlive) {
				conn.send({ type: "ping", data: null, timestamp: now });
			}
		}
	}, heartbeatInterval);

	return {
		handleConnection: async (ws: WebSocket, context: C) => {
			if (connectionCount >= maxConnections) {
				ws.close(1013, "Server is at capacity");
				return;
			}

			const connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const connection: WebSocketConnection = {
				id: connectionId,
				context,
				send: (event) => {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify(event));
					}
				},
				close: () => {
					ws.close();
				},
				isAlive: true,
				lastPing: new Date(),
				subscriptions: new Set(),
			};

			connections.set(connectionId, connection);
			connectionCount++;

			ws.onmessage = async (event) => {
				try {
					const message = JSON.parse(event.data as string);

					if (message.type === "pong") {
						connection.lastPing = new Date();
						connection.isAlive = true;
						return;
					}

					if (message.type === "rpc") {
						// Handle RPC call over WebSocket
						const { procedure, input, id } = message;
						try {
							const result = await router.call(procedure, context, input);
							const event: StreamingEvent = {
								type: "rpc_response",
								data: { id, result },
							};
							if (context.correlationId) {
								event.correlationId = context.correlationId;
							}
							connection.send(event);
						} catch (error) {
							const event: StreamingEvent = {
								type: "rpc_error",
								data: {
									id,
									error: error instanceof Error ? error.message : String(error)
								},
							};
							if (context.correlationId) {
								event.correlationId = context.correlationId;
							}
							connection.send(event);
						}
						return;
					}

					if (message.type === "subscribe") {
						eventBroker.subscribe(message.eventType, connection);
						connection.send({
							type: "subscribed",
							data: { eventType: message.eventType },
						});
						return;
					}

					if (message.type === "unsubscribe") {
						eventBroker.unsubscribe(message.eventType, connection);
						connection.send({
							type: "unsubscribed",
							data: { eventType: message.eventType },
						});
						return;
					}

				} catch (error) {
					connection.send({
						type: "error",
						data: { message: "Invalid message format" },
					});
				}
			};

			ws.onclose = () => {
				eventBroker.unsubscribeAll(connection);
				connections.delete(connectionId);
				connectionCount--;
			};

			ws.onerror = (error) => {
				console.error(`WebSocket error for connection ${connectionId}:`, error);
				eventBroker.unsubscribeAll(connection);
				connections.delete(connectionId);
				connectionCount--;
			};

			// Send welcome message
			connection.send({
				type: "connected",
				data: { connectionId },
				timestamp: new Date(),
			});
		},

		getConnectionCount: () => connectionCount,
		getConnections: () => Array.from(connections.values()),
		broadcast: (event: StreamingEvent) => eventBroker.publish(event),
		cleanup: () => {
			clearInterval(heartbeatIntervalId);
			for (const conn of connections.values()) {
				conn.close();
			}
			connections.clear();
			connectionCount = 0;
		},
	};
}

// Server-Sent Events handler factory
export function createSSEHandler<C extends Context>(
	router: OrpcRouter<C>,
	eventBroker: EventBroker,
	config: StreamingConfig = {},
) {
	const {
		maxConnections = 1000,
		connectionTimeout = 300000,
	} = config;

	const connections = new Map<string, SSEConnection>();
	let connectionCount = 0;

	// Connection cleanup
	const cleanupIntervalId = setInterval(() => {
		const now = new Date();
		for (const [id, conn] of connections) {
			if (now.getTime() - conn.lastActivity.getTime() > connectionTimeout) {
				try {
					conn.controller.close();
				} catch (error) {
					// Ignore errors when closing
				}
				connections.delete(id);
				connectionCount--;
			}
		}
	}, 60000); // Check every minute

	return {
		handleConnection: async (context: C, request: Request): Promise<Response> => {
			if (connectionCount >= maxConnections) {
				return new Response("Server is at capacity", { status: 503 });
			}

			const connectionId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const stream = new ReadableStream({
				start(controller) {
					const connection: SSEConnection = {
						id: connectionId,
						context,
						controller,
						response: this as any, // Type assertion for response
						isAlive: true,
						lastActivity: new Date(),
						subscriptions: new Set(),
					};

					connections.set(connectionId, connection);
					connectionCount++;

					// Send initial event
					const initData = `event: connected\ndata: ${JSON.stringify({ connectionId })}\n\n`;
					controller.enqueue(new TextEncoder().encode(initData));
				},
				cancel() {
					const conn = connections.get(connectionId);
					if (conn) {
						eventBroker.unsubscribeAll(conn);
						connections.delete(connectionId);
						connectionCount--;
					}
				},
			});

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					"Connection": "keep-alive",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Cache-Control",
				},
			});
		},

		getConnectionCount: () => connectionCount,
		getConnections: () => Array.from(connections.values()),
		broadcast: (event: StreamingEvent) => eventBroker.publish(event),
		cleanup: () => {
			clearInterval(cleanupIntervalId);
			for (const conn of connections.values()) {
				try {
					conn.controller.close();
				} catch (error) {
					// Ignore errors when closing
				}
			}
			connections.clear();
			connectionCount = 0;
		},
	};
}

// Global event broker instance
export const globalEventBroker = new EventBroker();
