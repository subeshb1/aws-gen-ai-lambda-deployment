.PHONY: deploy-all deploy-services deploy-cdn deploy-frontend clean-all deploy-realtime-ws deploy-stream-sse deploy-sync-api destroy-all destroy-realtime-ws destroy-stream-sse destroy-sync-api destroy-cdn

# Default owner value if not set
OWNER ?= your-name@your-company.com

# Export for child processes
export OWNER

# Deploy all components in the correct order
deploy-all: deploy-services deploy-cdn deploy-frontend

# Individual service deployments
deploy-realtime-ws:
	@echo "Deploying WebSocket service as $(OWNER)..."
	@$(MAKE) -C services/realtime-ws deploy

deploy-stream-sse:
	@echo "Deploying SSE service as $(OWNER)..."
	@$(MAKE) -C services/stream-sse deploy

deploy-sync-api:
	@echo "Deploying REST API service as $(OWNER)..."
	@$(MAKE) -C services/sync-api deploy

# Deploy all backend services in parallel and wait for completion
deploy-services:
	@echo "Deploying all backend services in parallel..."
	@$(MAKE) deploy-realtime-ws & \
	$(MAKE) deploy-stream-sse & \
	$(MAKE) deploy-sync-api & \
	wait
	@echo "All backend services deployed successfully!"

# Deploy CDN after services
deploy-cdn:
	@echo "Deploying CDN infrastructure as $(OWNER)..."
	@$(MAKE) -C infra/cdn deploy
	@echo "CDN deployed successfully!"

# Deploy frontend after CDN
deploy-frontend:
	@echo "Deploying frontend application..."
	@$(MAKE) -C client/web deploy
	@echo "Frontend deployed successfully!"

# Clean all projects
clean-all:
	@echo "Cleaning all projects..."
	@$(MAKE) -C services/realtime-ws clean
	@$(MAKE) -C services/stream-sse clean
	@$(MAKE) -C services/sync-api clean
	@$(MAKE) -C infra/cdn clean
	@$(MAKE) -C client/web clean
	@echo "All projects cleaned!"

# Bootstrap CDK (run once per account/region)
bootstrap:
	cdk bootstrap

# Destroy all components in the reverse order of deployment
destroy-all: destroy-cdn destroy-services

# Individual service destroy commands
destroy-realtime-ws:
	@echo "Destroying WebSocket service stack..."
	@$(MAKE) -C services/realtime-ws destroy

destroy-stream-sse:
	@echo "Destroying SSE service stack..."
	@$(MAKE) -C services/stream-sse destroy

destroy-sync-api:
	@echo "Destroying REST API service stack..."
	@$(MAKE) -C services/sync-api destroy

# Destroy all backend services in parallel
destroy-services:
	@echo "Destroying all backend services in parallel..."
	@$(MAKE) destroy-realtime-ws & \
	$(MAKE) destroy-stream-sse & \
	$(MAKE) destroy-sync-api & \
	wait
	@echo "All backend services destroyed successfully!"

# Destroy CDN
destroy-cdn:
	@echo "Destroying CDN infrastructure..."
	@$(MAKE) -C infra/cdn destroy
	@echo "CDN destroyed successfully!"

# Help target
help:
	@echo "Available targets:"
	@echo "  deploy-all     - Deploy all components (services in parallel, then CDN, then frontend)"
	@echo "  deploy-services- Deploy all backend services in parallel"
	@echo "  deploy-cdn     - Deploy CDN infrastructure"
	@echo "  deploy-frontend- Deploy frontend application"
	@echo "  clean-all      - Clean all projects"
	@echo "  bootstrap      - Bootstrap CDK (run once per account/region)"
	@echo "  destroy-all    - Destroy all components (frontend, then CDN, then services)"
	@echo "  help          - Show this help message"
	@echo ""
	@echo "Individual service targets:"
	@echo "  deploy-realtime-ws - Deploy WebSocket service"
	@echo "  deploy-stream-sse  - Deploy SSE service"
	@echo "  deploy-sync-api    - Deploy REST API service"
	@echo "  destroy-realtime-ws- Destroy WebSocket service"
	@echo "  destroy-stream-sse - Destroy SSE service"
	@echo "  destroy-sync-api   - Destroy REST API service"
	@echo ""
	@echo "Environment variables:"
	@echo "  OWNER         - Set the owner tag (default: $(OWNER))"
