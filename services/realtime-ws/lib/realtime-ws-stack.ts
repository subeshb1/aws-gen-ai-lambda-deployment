import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
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
      timeout: cdk.Duration.seconds(120),
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

    // Create IAM role for Lambda functions
    const lambdaRole = new iam.Role(this, 'WebSocketLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add WebSocket management permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*`,
        ],
      })
    );

    // Connect handler
    const connectHandler = new nodejs.NodejsFunction(this, 'ConnectHandler', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../src/handlers/websocket.ts'),
      handler: 'handleConnect',
      role: lambdaRole,
    });

    // Disconnect handler
    const disconnectHandler = new nodejs.NodejsFunction(
      this,
      'DisconnectHandler',
      {
        ...lambdaConfig,
        entry: path.join(__dirname, '../src/handlers/websocket.ts'),
        handler: 'handleDisconnect',
        role: lambdaRole,
      }
    );

    // Default handler
    const defaultHandler = new nodejs.NodejsFunction(this, 'DefaultHandler', {
      ...lambdaConfig,
      entry: path.join(__dirname, '../src/handlers/websocket.ts'),
      handler: 'handleDefault',
      role: lambdaRole,
    });

    // Create WebSocket API integrations
    const connectIntegration = new apigatewayv2.CfnIntegration(
      this,
      'ConnectIntegration',
      {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${connectHandler.functionArn}/invocations`,
      }
    );

    const disconnectIntegration = new apigatewayv2.CfnIntegration(
      this,
      'DisconnectIntegration',
      {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${disconnectHandler.functionArn}/invocations`,
      }
    );

    const defaultIntegration = new apigatewayv2.CfnIntegration(
      this,
      'DefaultIntegration',
      {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${defaultHandler.functionArn}/invocations`,
      }
    );

    // Create WebSocket API routes
    new apigatewayv2.CfnRoute(this, 'ConnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$connect',
      authorizationType: 'NONE',
      target: `integrations/${connectIntegration.ref}`,
    });

    new apigatewayv2.CfnRoute(this, 'DisconnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$disconnect',
      authorizationType: 'NONE',
      target: `integrations/${disconnectIntegration.ref}`,
    });

    new apigatewayv2.CfnRoute(this, 'DefaultRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$default',
      authorizationType: 'NONE',
      target: `integrations/${defaultIntegration.ref}`,
    });

    // Create stage
    const stage = new apigatewayv2.CfnStage(this, 'ProductionStage', {
      apiId: webSocketApi.ref,
      stageName: 'ws',
      autoDeploy: true,
    });

    // Grant Lambda permissions to API Gateway
    connectHandler.addPermission('APIGWPermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*/*`,
    });

    disconnectHandler.addPermission('APIGWPermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*/*`,
    });

    defaultHandler.addPermission('APIGWPermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*/*`,
    });

    // Store WebSocket endpoint in SSM
    const wsEndpoint = `${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com`;
    new ssm.StringParameter(this, 'WebSocketEndpoint', {
      parameterName: '/genai/websocket/endpoint',
      stringValue: wsEndpoint,
      description: 'WebSocket API endpoint',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output the WebSocket URL
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: `wss://${wsEndpoint}`,
      description: 'WebSocket API URL',
    });
  }
}
