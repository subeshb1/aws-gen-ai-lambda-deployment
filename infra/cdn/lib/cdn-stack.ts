import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface CdnStackProps extends cdk.StackProps {
  owner?: string;
}

export class CdnStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly staticBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: CdnStackProps) {
    super(scope, id, props);

    // Get owner from env, context, or default
    const owner =
      process.env.OWNER || this.node.tryGetContext('owner') || props?.owner;

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Owner', owner);

    // Fetch endpoints from SSM
    const webSocketEndpoint = ssm.StringParameter.valueForStringParameter(
      this,
      '/genai/websocket/endpoint'
    );

    const sseEndpoint = ssm.StringParameter.valueForStringParameter(
      this,
      '/genai/sse/endpoint'
    );

    const restApiEndpoint = ssm.StringParameter.valueForStringParameter(
      this,
      '/genai/rest/endpoint'
    );

    // Create S3 bucket for static content
    this.staticBucket = new s3.Bucket(this, 'StaticContentBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Store bucket name in SSM
    new ssm.StringParameter(this, 'StaticBucketName', {
      parameterName: '/genai/static/bucket-name',
      stringValue: this.staticBucket.bucketName,
      description: 'S3 bucket name for static content',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'GenAIDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(
          this.staticBucket
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        // WebSocket API behavior
        '/ws/*': {
          origin: new origins.HttpOrigin(
            webSocketEndpoint.replace('wss://', ''),
            {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            }
          ),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        // SSE API behavior
        '/sse/*': {
          origin: origins.FunctionUrlOrigin.withOriginAccessControl({
            url: sseEndpoint,
            authType: lambda.FunctionUrlAuthType.AWS_IAM,
            functionArn: `***REMOVED***`,
          } as any),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        // REST API behavior
        '/api/*': {
          origin: new origins.HttpOrigin(
            restApiEndpoint.replace('https://', '').split('/')[0],
            {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            }
          ),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: 'GenAI Application Distribution',
      defaultRootObject: 'index.html',
    });

    // Store CloudFront domain in SSM
    new ssm.StringParameter(this, 'CloudFrontDomain', {
      parameterName: '/genai/static/cloudfront-domain',
      stringValue: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output the CloudFront URL and S3 bucket name
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'StaticBucketNameOutput', {
      value: this.staticBucket.bucketName,
      description: 'S3 Static Content Bucket Name',
    });
  }
}
