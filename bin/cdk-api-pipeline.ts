#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { CreateELBStack } from '../lib/create-elb-stack';
import { OtherPartStack } from '../lib/otherpart-stack';

process.env.GITHUB_TOKEN = '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';
//process.env.GITHUB_TOKEN = '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';

if (!process.env.GITHUB_TOKEN) {
  console.log("No Github Token present");
}

const app = new cdk.App();
new CreateELBStack(app, 'CreateELBStack', {
  env: {
    region: "ap-northeast-1",
  }
});

new PipelineStack(app, 'PipelineStack', {
  githubToken: process.env.GITHUB_TOKEN || "",
  env: {
    region: "ap-northeast-1",
  }
});

new OtherPartStack(app, 'OtherPartStack', {
  env: {
    region: "ap-northeast-1",
  }
});

app.synth();