# AWS Serverless GenAI Deployment Strategies

This repository demonstrates different deployment strategies for GenAI applications using AWS Serverless services.

## Project Structure

```
.
├── infra/                     # Shared infrastructure components
│   └── cdn/                  # CloudFront and S3 static hosting setup
├── services/                  # Backend services
│   ├── realtime-ws/         # WebSocket-based streaming using API Gateway WebSocket
│   ├── stream-sse/          # Server-Sent Events streaming using Lambda URLs
│   └── sync-api/           # Synchronous REST API using API Gateway + Lambda
├── client/                    # Frontend application
│   ├── web/                 # React/TypeScript web application
│   └── shared/              # Shared utilities and API clients
└── examples/                  # Example implementations and demos
```

## Deployment Strategies

### 1. Realtime WebSocket (realtime-ws)
- Real-time bidirectional communication
- Suitable for streaming responses and maintaining persistent connections
- Uses API Gateway WebSocket APIs and Lambda

### 2. Server-Sent Events Stream (stream-sse)
- One-way server-to-client streaming
- Uses Lambda Function URLs
- Efficient for streaming AI responses

### 3. Synchronous API (sync-api)
- Traditional request-response pattern
- API Gateway + Lambda integration
- Suitable for non-streaming AI interactions

### 4. Infrastructure (infra/cdn)
- CloudFront distribution as CDN
- S3 bucket for hosting frontend assets
- Optimized content delivery and caching

## Frontend (client/web)
- Modern web application
- Demonstrates integration with all deployment strategies
- Clean and intuitive UI/UX for GenAI interactions

## Prerequisites
- AWS Account and configured AWS CLI
- Node.js (>= 14.x) and npm/yarn
- AWS SDK v3
- AWS CDK v2 (`npm install -g aws-cdk`)
- TypeScript (`npm install -g typescript`)

## Infrastructure
Each service uses AWS CDK for infrastructure provisioning. The `cdk.json` file in each service directory contains the context and configuration for the respective stacks.
