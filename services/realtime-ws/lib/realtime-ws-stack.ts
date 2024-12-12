import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';

export interface RealtimeWsStackProps extends cdk.StackProps {
  owner?: string;
}

export class RealtimeWsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: RealtimeWsStackProps) {
    super(scope, id, props);

    // Get owner from env, context, or default
    const owner =
      process.env.OWNER || this.node.tryGetContext('owner') || props?.owner;

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Owner', owner);

    // Create WebSocket API
    const webSocketApi = new apigatewayv2.CfnApi(this, 'GenAIWebSocketApi', {
      name: 'GenAI WebSocket API',
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    // Common Lambda configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_LATEST,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'dummy-key',
        NODE_OPTIONS: '--enable-source-maps',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        loader: {
          '.ts': 'ts',
        },
        format: nodejs.OutputFormat.ESM,
        mainFields: ['module', 'main'],
        esbuildArgs: {
          '--external:aws-sdk': true,
        },
        externalModules: ['aws-sdk'],
      },
    };

    // Connect handler
    const connectHandler = new nodejs.NodejsFunction(this, 'ConnectHandler', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../src/handlers/websocket.ts'),
      handler: 'handleConnect',
    });

    // Disconnect handler
    const disconnectHandler = new nodejs.NodejsFunction(
      this,
      'DisconnectHandler',
      {
        ...lambdaConfig,
        entry: path.join(__dirname, '../src/handlers/websocket.ts'),
        handler: 'handleDisconnect',
      }
    );

    // Default handler
    const defaultHandler = new nodejs.NodejsFunction(this, 'DefaultHandler', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../src/handlers/websocket.ts'),
      handler: 'handleDefault',
    });

    // Create routes
    const connectRoute = new apigatewayv2.CfnRoute(this, 'ConnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$connect',
      authorizationType: 'NONE',
      target: `integrations/${
        new apigatewayv2.CfnIntegration(this, 'ConnectIntegration', {
          apiId: webSocketApi.ref,
          integrationType: 'AWS_PROXY',
          integrationUri: connectHandler.functionArn,
        }).ref
      }`,
    });

    const disconnectRoute = new apigatewayv2.CfnRoute(this, 'DisconnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$disconnect',
      authorizationType: 'NONE',
      target: `integrations/${
        new apigatewayv2.CfnIntegration(this, 'DisconnectIntegration', {
          apiId: webSocketApi.ref,
          integrationType: 'AWS_PROXY',
          integrationUri: disconnectHandler.functionArn,
        }).ref
      }`,
    });

    const defaultRoute = new apigatewayv2.CfnRoute(this, 'DefaultRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$default',
      authorizationType: 'NONE',
      target: `integrations/${
        new apigatewayv2.CfnIntegration(this, 'DefaultIntegration', {
          apiId: webSocketApi.ref,
          integrationType: 'AWS_PROXY',
          integrationUri: defaultHandler.functionArn,
        }).ref
      }`,
    });

    // Create stage
    const stage = new apigatewayv2.CfnStage(this, 'ProdStage', {
      apiId: webSocketApi.ref,
      stageName: 'ws',
      autoDeploy: true,
    });

    // Store just the API Gateway domain in SSM
    const apiDomain = `${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com`;
    
    new ssm.StringParameter(this, 'WebSocketEndpoint', {
      parameterName: '/genai/websocket/endpoint',
      stringValue: apiDomain,
      description: 'WebSocket API Gateway domain',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output domain, stage URL, and full WebSocket URL
    new cdk.CfnOutput(this, 'WebSocketDomain', {
      value: apiDomain,
      description: 'WebSocket API Gateway domain',
    });

    new cdk.CfnOutput(this, 'WebSocketStageURL', {
      value: `${apiDomain}/${stage.stageName}`,
      description: 'WebSocket API Stage URL',
    });

    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: `wss://${apiDomain}/${stage.stageName}`,
      description: 'WebSocket API Full URL',
    });

    // Grant permissions to invoke Lambda functions
    [connectHandler, disconnectHandler, defaultHandler].forEach((handler) => {
      handler.addPermission(`${handler.node.id}Permission`, {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*`,
      });
    });
  }
}
