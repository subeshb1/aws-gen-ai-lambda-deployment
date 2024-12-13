import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';

export interface SyncApiStackProps extends cdk.StackProps {
  owner?: string;
}

export class SyncApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: SyncApiStackProps) {
    super(scope, id, props);

    // Get owner from env, context, or default
    const owner =
      process.env.OWNER || this.node.tryGetContext('owner') || props?.owner;

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Owner', owner);

    // Create Lambda function for API handler
    const apiHandler = new nodejs.NodejsFunction(this, 'APIHandler', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(30),
      entry: path.join(__dirname, '../src/handlers/api.ts'),
      handler: 'handler',
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
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'GenAIApi', {
      restApiName: 'GenAI Sync API',
      description: 'Synchronous API for GenAI interactions',
      deploy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'api',
      },
    });

    // Create API resources and methods
    const generateResource = api.root.addResource('generate');

    // Add POST method
    generateResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
            responseModels: {
              'application/json': apigateway.Model.ERROR_MODEL,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
            responseModels: {
              'application/json': apigateway.Model.ERROR_MODEL,
            },
          },
        ],
      }
    );

    // Extract just the domain name from API URL
    const apiDomain = api.url
      .replace('https://', '')
      .split('/')[0]; // Remove any trailing paths

    // Store just the API Gateway domain in SSM
    new ssm.StringParameter(this, 'RestApiEndpoint', {
      parameterName: '/genai/rest/endpoint',
      stringValue: apiDomain,
      description: 'REST API Gateway domain',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output domain, stage URL, and full URL
    new cdk.CfnOutput(this, 'APIDomain', {
      value: apiDomain,
      description: 'API Gateway domain',
    });

    new cdk.CfnOutput(this, 'APIStageURL', {
      value: `${apiDomain}/api`,
      description: 'API Gateway stage URL',
    });

    new cdk.CfnOutput(this, 'APIEndpointURL', {
      value: api.url,
      description: 'API Gateway URL with protocol',
    });
  }
}
