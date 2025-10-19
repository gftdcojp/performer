# Performer Demo App - Docker Compose Commands

.PHONY: help build up down restart logs clean dev prod

# Default target
help: ## Show this help message
	@echo "Performer Demo App - Docker Compose Commands"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

# Build the application
build: ## Build the Docker images
	docker-compose build --no-cache

# Start all services
up: ## Start all services (Neo4j + Demo App)
	docker-compose up -d

# Start all services with logs
up-logs: ## Start all services and show logs
	docker-compose up

# Stop all services
down: ## Stop all services
	docker-compose down

# Restart all services
restart: ## Restart all services
	docker-compose restart

# Show logs
logs: ## Show logs from all services
	docker-compose logs -f

# Show logs for specific service
logs-app: ## Show logs for demo-app service
	docker-compose logs -f demo-app

logs-db: ## Show logs for neo4j service
	docker-compose logs -f neo4j

# Clean up
clean: ## Remove containers, networks, and volumes
	docker-compose down -v --remove-orphans
	docker system prune -f

# Development mode
dev: ## Start development environment with hot reloading
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build

# Production mode
prod: ## Start production environment
	docker-compose up --build -d

# Database operations
db-connect: ## Connect to Neo4j database (requires cypher-shell)
	docker-compose exec neo4j cypher-shell -u neo4j -p password

db-browser: ## Open Neo4j Browser in default browser
	@echo "Neo4j Browser: http://localhost:7474"
	@echo "Username: neo4j"
	@echo "Password: password"

# Health check
health: ## Check health of all services
	@echo "Checking Neo4j..."
	@docker-compose exec neo4j cypher-shell -u neo4j -p password "MATCH () RETURN count(*) limit 1" > /dev/null && echo "✅ Neo4j is healthy" || echo "❌ Neo4j is not healthy"
	@echo "Checking Demo App..."
	@curl -f http://localhost:8100 > /dev/null && echo "✅ Demo App is healthy" || echo "❌ Demo App is not healthy"

# Setup and run
setup: build up health ## Build, start, and verify all services
	@echo "🎉 Setup complete! Visit http://localhost:8100"

# Quick start for first time users
quickstart: ## Quick start: clean, build, and run
	@echo "🚀 Starting Performer Demo App..."
	make clean
	make setup
