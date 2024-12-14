import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface StreamSseStackProps extends cdk.StackProps {
  owner?: string;
}

export class StreamSseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StreamSseStackProps) {
    super(scope, id, props);

    // Get owner from env, context, or default
    const owner =
      process.env.OWNER || this.node.tryGetContext('owner') || props?.owner;

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Owner', owner);

    // Create Lambda function for SSE handler
    const sseHandler = new nodejs.NodejsFunction(this, 'SSEHandler', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      timeout: cdk.Duration.seconds(120),
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../src/handlers/sse.ts'),
      handler: 'handler',
      environment: {
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

    // Add Bedrock permissions
    sseHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream'
        ],
        resources: ['*']
      })
    );

    // Add Function URL with IAM auth
    const functionUrl = sseHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
    });

    // Add CloudFront OAI to Lambda resource policy
    const functionResourcePolicy = new lambda.CfnPermission(
      this,
      'CloudFrontPermission',
      {
        action: 'lambda:InvokeFunctionUrl',
        functionName: sseHandler.functionName,
        principal: 'cloudfront.amazonaws.com',
        sourceArn: `arn:aws:cloudfront::${this.account}:distribution/*`,
      }
    );

    // Store just the function domain in SSM
    new ssm.StringParameter(this, 'SSEEndpoint', {
      parameterName: '/genai/sse/endpoint',
      stringValue: functionUrl.url.replace('https://', ''),
      description: 'SSE Lambda Function URL domain',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store Lambda function ARN in SSM
    new ssm.StringParameter(this, 'SSELambdaArn', {
      parameterName: '/genai/sse/lambda-arn',
      stringValue: sseHandler.functionArn,
      description: 'SSE Lambda Function ARN',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output both domain and full URL
    new cdk.CfnOutput(this, 'SSEDomain', {
      value: functionUrl.url.replace('https://', ''),
      description: 'SSE Function URL domain',
    });

    new cdk.CfnOutput(this, 'SSEEndpointURL', {
      value: functionUrl.url,
      description: 'SSE Function URL with protocol',
    });
  }
}
