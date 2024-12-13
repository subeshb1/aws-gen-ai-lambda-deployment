.PHONY: install build deploy clean

# AWS Region
AWS_REGION ?= ap-southeast-2

# Get CloudFront domain from SSM
CLOUDFRONT_DOMAIN := $(shell aws ssm get-parameter --name /genai/static/cloudfront-domain --region $(AWS_REGION) --query 'Parameter.Value' --output text)
BUCKET_NAME := $(shell aws ssm get-parameter --name /genai/static/bucket-name --region $(AWS_REGION) --query 'Parameter.Value' --output text)

# Export for environment substitution
export CLOUDFRONT_DOMAIN

install:
	npm install

# Build with environment variables
build: install
	npm run build

# Deploy to S3 and invalidate CloudFront
deploy: build
	@echo "Deploying to bucket: $(BUCKET_NAME)"
	aws s3 sync dist s3://$(BUCKET_NAME) --delete
	@echo "Creating CloudFront invalidation"
	aws cloudfront create-invalidation --distribution-id $(shell aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$(CLOUDFRONT_DOMAIN)'].Id" --output text) --paths "/*"
	@echo "Deployment complete! Website available at: https://$(CLOUDFRONT_DOMAIN)"

# Clean build artifacts
clean:
	rm -rf node_modules
	rm -rf dist

# Show deployment info
info:
	@echo "Deployment Information:"
	@echo "CloudFront Domain: $(CLOUDFRONT_DOMAIN)"
	@echo "S3 Bucket: $(BUCKET_NAME)"
	@echo "Website URL: https://$(CLOUDFRONT_DOMAIN)"
