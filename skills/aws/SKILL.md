---
name: aws
description: Manage AWS resources via the aws CLI.
metadata:
  displayName: AWS
  icon: cloud
  category: cloud
  version: 1.0.0
  dependencies:
    cli: aws
    checkCommand: aws --version
    install:
      darwin:
        brew: awscli
        scriptArch:
          x64: curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg" && sudo installer -pkg AWSCLIV2.pkg -target /
          arm64: curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg" && sudo installer -pkg AWSCLIV2.pkg -target /
        manual: Download installer from https://aws.amazon.com/cli/
      linux:
        scriptArch:
          x64: curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install
          arm64: curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install
        pip: awscli
      windows:
        winget: Amazon.AWSCLI
        choco: awscli
        scoop: aws
        manual: Download MSI from https://aws.amazon.com/cli/
  config:
    - name: AWS_DEFAULT_REGION
      label: Default Region
      type: string
      required: false
      placeholder: us-east-1
    - name: AWS_PROFILE
      label: Profile
      type: string
      required: false
      placeholder: default
  auth:
    type: api-key
    setupCommand: aws configure
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
