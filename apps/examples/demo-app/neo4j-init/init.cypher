// Initialize Neo4j database for Performer Demo App

// Create constraints for ProcessInstance
CREATE CONSTRAINT process_instance_id_unique IF NOT EXISTS FOR (p:ProcessInstance) REQUIRE p.id IS UNIQUE;
CREATE INDEX process_instance_business_key IF NOT EXISTS FOR (p:ProcessInstance) ON (p.businessKey);
CREATE INDEX process_instance_status IF NOT EXISTS FOR (p:ProcessInstance) ON (p.status);

// Create constraints for Task
CREATE CONSTRAINT task_id_unique IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE;
CREATE INDEX task_assignee IF NOT EXISTS FOR (t:Task) ON (t.assignee);
CREATE INDEX task_status IF NOT EXISTS FOR (t:Task) ON (t.status);

// Create constraints for User
CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email);

// Create some sample data
CREATE (u1:User {
  id: "user-1",
  email: "admin@demo.com",
  roles: ["admin", "manager"],
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (u2:User {
  id: "user-2",
  email: "user@demo.com",
  roles: ["user"],
  createdAt: datetime(),
  updatedAt: datetime()
});

// Create sample process instance
CREATE (p1:ProcessInstance {
  id: "process-1",
  processId: "OrderProcess",
  businessKey: "demo-order-001",
  status: "running",
  variables: "{ \"customerId\": \"user-1\", \"amount\": 750, \"status\": \"submitted\" }",
  startTime: datetime(),
  createdAt: datetime(),
  updatedAt: datetime()
});

// Create sample tasks
CREATE (t1:Task {
  id: "task-1",
  taskId: "validate-order",
  name: "Validate Order Details",
  type: "user",
  status: "completed",
  assignee: "user-1",
  priority: 1,
  variables: "{ \"orderId\": \"process-1\" }",
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (t2:Task {
  id: "task-2",
  taskId: "manager-approval",
  name: "Manager Approval Required",
  type: "user",
  status: "running",
  assignee: "user-1",
  priority: 2,
  variables: "{ \"orderId\": \"process-1\", \"amount\": 750 }",
  dueDate: datetime() + duration('P1D'),
  createdAt: datetime(),
  updatedAt: datetime()
});

// Connect process to tasks
MATCH (p:ProcessInstance {id: "process-1"}), (t1:Task {id: "task-1"}), (t2:Task {id: "task-2"})
CREATE (p)-[:HAS_TASK]->(t1)
CREATE (p)-[:HAS_TASK]->(t2)
CREATE (t1)-[:NEXT]->(t2);
