.PHONY: install build deploy clean destroy

install:
	npm install

build:
	npm run build

deploy: install build
	cdk deploy --require-approval never --context owner=$(OWNER)

destroy:
	cdk destroy --force --context owner=$(OWNER)

clean:
	rm -rf node_modules
	rm -rf cdk.out
	rm -rf dist 
