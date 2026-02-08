---
name: aws
description: Manage AWS resources via the aws CLI.
---

# AWS CLI

Use `aws` to interact with Amazon Web Services.

## Common Commands

### S3
- List buckets: `aws s3 ls`
- List objects: `aws s3 ls s3://<bucket-name>`
- Copy file: `aws s3 cp <source> <destination>`

### EC2
- List instances: `aws ec2 describe-instances`
- Start instance: `aws ec2 start-instances --instance-ids <id>`
- Stop instance: `aws ec2 stop-instances --instance-ids <id>`

### Lambda
- List functions: `aws lambda list-functions`
- Invoke function: `aws lambda invoke --function-name <name> output.json`

## Notes
- Requires `aws` CLI to be installed and configured (`aws configure`).
