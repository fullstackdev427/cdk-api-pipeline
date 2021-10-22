
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as lambda from '@aws-cdk/aws-lambda';
import { App, Stack, StackProps, SecretValue } from '@aws-cdk/core';
import events = require('@aws-cdk/aws-events');
import { Construct } from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

export interface ElasticBeanStalkDeployActionProps extends codepipeline.CommonAwsActionProps {
    applicationName: string;

    environmentName: string;
    
    input: codepipeline.Artifact;
}

export class ElasticBeanStalkDeployAction implements codepipeline.IAction {
    public readonly actionProperties: codepipeline.ActionProperties;
    private readonly props: ElasticBeanStalkDeployActionProps;

    constructor(props: ElasticBeanStalkDeployActionProps) {
        this.actionProperties = {
            ...props,
            provider: 'ElasticBeanstalk',
            category: codepipeline.ActionCategory.DEPLOY,
            artifactBounds: { minInputs: 1, maxInputs: 1, minOutputs: 0, maxOutputs: 0 },
            inputs: [props.input],
        };
        this.props = props;
    }

    public bind(_scope: Construct, _stage: codepipeline.IStage, options: codepipeline.ActionBindOptions):
            codepipeline.ActionConfig {
        options.bucket.grantRead(options.role);
        options.role.addToPrincipalPolicy(new iam.PolicyStatement({
          resources: ['*'],
          actions: ['elasticbeanstalk:*',
          'autoscaling:*',
          'elasticloadbalancing:*',
          'rds:*',
          's3:*',
          'cloudwatch:*',
          'cloudformation:*',
          'ec2:*'],
        }));
        return {
            configuration: {
                ApplicationName: this.props.applicationName,
                EnvironmentName: this.props.environmentName,
            },
        };
    }

    public onStateChange(_name: string, _target?: events.IRuleTarget, _options?: events.RuleProps): events.Rule {
        throw new Error('unsupported');
    }
}

export interface PipelineStackProps extends StackProps {
  readonly githubToken: string;
}

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props: PipelineStackProps) {
    super(app, id, props);

    // Create Artifacts
    const sourceOutput = new codepipeline.Artifact("SrcOutput");

    // Complete Pipeline Project
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'Checkout',
              output: sourceOutput,
              owner: "fullstackdev427",
              //owner: "anybirth-inc",
              repo: "eb-laravel",
              //repo: "picaroai",
              //branch: "develop_alpha",
              branch: "main",
              variablesNamespace: "SourceVariables",
              oauthToken: SecretValue.plainText(props.githubToken),
              trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new ElasticBeanStalkDeployAction({
              actionName: 'Deploy',
              applicationName: 'LaravelApp',
              environmentName: 'PHP-74-Pipeline-211012',
              variablesNamespace: 'DeployVariables',
              input: sourceOutput,
            }),
          ],
        },
      ],
      
    });
    pipeline.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-AWSElasticBeanstalk'));
  }
}